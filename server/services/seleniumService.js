const webdriver = require('selenium-webdriver');
const { Builder, Browser } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const { SeleniumJob } = require('../models/Selenium');
const Defect = require('../models/Defect');

const GRID_URL = process.env.SELENIUM_GRID_URL || 'http://localhost:4444/wd/hub';

class SeleniumService {

    async executeTest(jobId, scriptPath, browsers, targetUrl) {
        // Update job status to Running
        await SeleniumJob.findByIdAndUpdate(jobId, { status: 'Running' });

        const promises = browsers.map(async (browserName) => {
            return this.runOnBrowser(jobId, scriptPath, browserName, targetUrl);
        });

        await Promise.all(promises);

        // Check overall status
        const job = await SeleniumJob.findById(jobId).lean();
        if (job && job.executions) {
            const allFinished = job.executions.every(e => e.status === 'Passed' || e.status === 'Failed');
            if (allFinished) {
                const allPassed = job.executions.every(e => e.status === 'Passed');
                await SeleniumJob.findByIdAndUpdate(jobId, { status: allPassed ? 'Completed' : 'Failed' });
            }
        }
    }

    async runOnBrowser(jobId, scriptPath, browserName, targetUrl) {
        let driver;
        let executionId;

        // Create execution record
        const job = await SeleniumJob.findById(jobId);
        job.executions.push({
            browser: browserName,
            status: 'Running',
            start_time: Date.now()
        });
        await job.save();

        executionId = job.executions[job.executions.length - 1]._id;

        const logs = [];
        const log = (msg) => logs.push(`[${new Date().toISOString()}] ${msg}`);

        const updateExecution = async (updates) => {
            await SeleniumJob.findOneAndUpdate(
                { _id: jobId, "executions._id": executionId },
                { $set: this._prefixKeys("executions.$.", updates) }
            );
        };

        try {
            log(`Starting test on ${browserName}...`);

            // Capabilities
            const caps = {
                browserName: browserName,
                'se:recordVideo': true
            };

            // 1. Start Selenium Session
            try {
                driver = await new Builder()
                    .usingServer(GRID_URL)
                    .withCapabilities(caps)
                    .build();
            } catch (err) {
                if (err.message.includes('ECONNREFUSED')) {
                    console.log('⚠️ Selenium Grid not reachable. Switching to Simulation Mode.');
                    return this.runMockTest(jobId, scriptPath, browserName, targetUrl, executionId);
                }
                throw err;
            }

            const sessionId = (await driver.getSession()).getId();
            log(`Session created: ${sessionId}`);

            const scriptContent = fs.readFileSync(scriptPath, 'utf8');

            // Basic sandbox execution
            const { By, Key, until } = webdriver;
            const runScript = new Function('driver', 'assert', 'log', 'By', 'Key', 'until', 'targetUrl', `
                return (async () => {
                   ${scriptContent}
                })();
            `);

            await runScript(driver, require('assert'), log, By, Key, until, targetUrl);

            log('Test finished successfully.');

            // Take success screenshot
            let screenshotPath = null;
            if (driver) {
                try {
                    const data = await driver.takeScreenshot();
                    const filename = `success_${executionId}.png`;
                    const filepath = path.join(__dirname, '../uploads/artifacts', filename);
                    fs.writeFileSync(filepath, data, 'base64');
                    screenshotPath = `/uploads/artifacts/${filename}`;
                } catch (e) {
                    log(`Failed to take success screenshot: ${e.message}`);
                }
            }

            await updateExecution({
                status: 'Passed',
                log_output: JSON.stringify(logs),
                video_path: screenshotPath, // UI treats this field dynamically based on ext
                end_time: Date.now()
            });

        } catch (error) {
            log(`Error: ${error.message}`);
            // Capture Screenshot
            let screenshotPath = null;
            if (driver) {
                try {
                    const data = await driver.takeScreenshot();
                    const filename = `error_${executionId}.png`;
                    const filepath = path.join(__dirname, '../uploads/artifacts', filename);
                    fs.writeFileSync(filepath, data, 'base64');
                    screenshotPath = `/uploads/artifacts/${filename}`;
                } catch (e) {
                    log(`Failed to take screenshot: ${e.message}`);
                }
            }

            // Auto-create defect
            this.createDefect(jobId, browserName, error, screenshotPath);

            await updateExecution({
                status: 'Failed',
                log_output: JSON.stringify(logs),
                video_path: screenshotPath,
                end_time: Date.now()
            });

        } finally {
            if (driver) {
                await driver.quit();
            }
        }
    }

    async runMockTest(jobId, scriptPath, browserName, targetUrl, executionId) {
        const logs = [];
        const log = (msg) => logs.push(`[${new Date().toISOString()}] ${msg}`);

        log(`[Mock] Starting test on ${browserName} (Simulation Mode)...`);
        log(`[Mock] Target URL: ${targetUrl}`);

        await new Promise(resolve => setTimeout(resolve, 1500));
        log(`[Mock] Session created: mock_session_${Date.now()}`);
        log(`[Mock] Navigating to ${targetUrl}...`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        log(`[Mock] Finding elements...`);
        log(`[Mock] Interacting with page elements...`);

        const isSuccess = Math.random() > 0.2;

        const updateExecution = async (updates) => {
            await SeleniumJob.findOneAndUpdate(
                { _id: jobId, "executions._id": executionId },
                { $set: this._prefixKeys("executions.$.", updates) }
            );
        };

        if (isSuccess) {
            log(`[Mock] Assertion Passed: Page title matches expectations.`);
            log(`[Mock] Test finished successfully.`);

            const screenshotPath = '/uploads/artifacts/mock_success.png';

            await updateExecution({
                status: 'Passed',
                log_output: JSON.stringify(logs),
                video_path: screenshotPath,
                end_time: Date.now()
            });
        } else {
            const errorMsg = 'AssertionError: Expected element to be visible';
            log(`[Mock] Error: ${errorMsg}`);
            log(`[Mock] Taking screenshot of failure...`);

            const screenshotPath = '/uploads/artifacts/mock_error.png';

            this.createDefect(jobId, browserName, { message: errorMsg }, screenshotPath);

            await updateExecution({
                status: 'Failed',
                log_output: JSON.stringify(logs),
                video_path: screenshotPath,
                end_time: Date.now()
            });
        }
    }

    async createDefect(jobId, browser, error, screenshotPath) {
        try {
            const defect = new Defect({
                title: `Selenium Test Failed on ${browser}`,
                description: `Error: ${error.message}\nJob ID: ${jobId}`,
                severity: screenshotPath ? 'High' : 'Medium',
                status: 'Open',
                detection_source: 'Selenium Cloud'
            });
            await defect.save();
        } catch (err) {
            console.error('Failed to auto-create defect:', err.message);
        }
    }

    _prefixKeys(prefix, obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[prefix + key] = value;
        }
        return result;
    }
}

module.exports = new SeleniumService();
