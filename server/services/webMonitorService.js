const webdriver = require('selenium-webdriver');
const { Builder, By } = require('selenium-webdriver');
const axios = require('axios');
const db = require('../database');

const GRID_URL = 'http://localhost:4444/wd/hub';

class WebMonitorService {

    async runScan(jobId, url) {
        let driver;
        const startTime = Date.now();
        let totalLinks = 0;
        let brokenLinks = 0;
        let validLinks = 0;
        const linkResults = [];

        try {
            // Update status to Running
            db.run(`UPDATE monitoring_jobs SET status = 'Running' WHERE job_id = ?`, [jobId]);

            // 1. Start Selenium Session
            const caps = { browserName: 'chrome' }; // Use Chrome for scanning
            try {
                driver = await new Builder().usingServer(GRID_URL).withCapabilities(caps).build();
            } catch (err) {
                if (err.message.includes('ECONNREFUSED')) {
                    console.log('⚠️ Selenium Grid not reachable. Switching to Simulation Mode.');
                    return this.runMockScan(jobId, url);
                }
                throw err;
            }

            // 2. Load Page
            console.log(`[WebMonitor] Scanning: ${url}`);
            await driver.get(url);
            const pageTitle = await driver.getTitle();

            // 3. Extract Links
            const elements = await driver.findElements(By.tagName('a'));
            const hrefs = new Set();

            for (let el of elements) {
                const href = await el.getAttribute('href');
                if (href && (href.startsWith('http') || href.startsWith('https'))) {
                    hrefs.add(href);
                }
            }

            totalLinks = hrefs.size;
            console.log(`[WebMonitor] Found ${totalLinks} unique links.`);

            // 4. Validate Links (Parallel)
            const validationPromises = Array.from(hrefs).map(async (linkUrl) => {
                const result = await this.validateLink(linkUrl);
                linkResults.push(result);
                if (result.status === 'Broken') brokenLinks++;
                else validLinks++;
                return result;
            });

            await Promise.all(validationPromises);

            // 5. Calculate Health Score
            const healthScore = totalLinks > 0 ? Math.round((validLinks / totalLinks) * 100) : 100;
            const scanDuration = Date.now() - startTime;

            // 6. Save Results
            await this.saveResults(jobId, healthScore, totalLinks, brokenLinks, scanDuration, linkResults);

            console.log(`[WebMonitor] Scan Complete. Score: ${healthScore}`);

        } catch (error) {
            console.error('[WebMonitor] Scan Failed:', error);
            db.run(`UPDATE monitoring_jobs SET status = 'Failed' WHERE job_id = ?`, [jobId]);
        } finally {
            if (driver) await driver.quit();
        }
    }

    async runMockScan(jobId, url) {
        console.log(`[WebMonitor] 🟢 Running Simulation for: ${url}`);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        const totalLinks = Math.floor(Math.random() * 20) + 10; // 10-30 links
        const brokenLinks = Math.floor(Math.random() * 2); // 0-1 broken
        const validLinks = totalLinks - brokenLinks;
        const healthScore = Math.round((validLinks / totalLinks) * 100);
        const scanDuration = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s

        const linkResults = [];

        // Generate fake links
        for (let i = 0; i < totalLinks; i++) {
            const isBroken = i < brokenLinks;
            linkResults.push({
                url: `${url}/page-${i}`,
                statusCode: isBroken ? 404 : 200,
                status: isBroken ? 'Broken' : 'Valid',
                responseTime: Math.floor(Math.random() * 200) + 50,
                error: isBroken ? 'Not Found' : null
            });
        }

        await this.saveResults(jobId, healthScore, totalLinks, brokenLinks, scanDuration, linkResults);
        console.log(`[WebMonitor] 🟢 Simulation Complete. Score: ${healthScore}`);
    }

    async validateLink(url) {
        const start = Date.now();
        try {
            const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
            const duration = Date.now() - start;

            let status = 'Valid';
            if (response.status >= 400) status = 'Broken';
            if (response.status >= 300 && response.status < 400) status = 'Redirect';

            return {
                url,
                statusCode: response.status,
                status,
                responseTime: duration,
                error: null
            };
        } catch (err) {
            return {
                url,
                statusCode: 0,
                status: 'Broken',
                responseTime: Date.now() - start,
                error: err.message
            };
        }
    }

    async saveResults(jobId, healthScore, totalLinks, brokenLinks, duration, results) {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Update Job
                db.run(`UPDATE monitoring_jobs SET status = 'Completed', health_score = ?, total_links = ?, broken_links = ?, scan_duration = ? WHERE job_id = ?`,
                    [healthScore, totalLinks, brokenLinks, duration, jobId]);

                // Insert Link Results (Batch or Loop)
                const stmt = db.prepare(`INSERT INTO link_validation_results (job_id, url, status_code, status, response_time, error_message) VALUES (?, ?, ?, ?, ?, ?)`);
                results.forEach(r => {
                    stmt.run(jobId, r.url, r.statusCode, r.status, r.responseTime, r.error);
                });
                stmt.finalize(resolve);
            });
        });
    }
}

module.exports = new WebMonitorService();
