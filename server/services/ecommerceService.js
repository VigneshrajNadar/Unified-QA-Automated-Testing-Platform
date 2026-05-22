const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class EcommerceService {

    constructor() {
        this.automationDir = path.resolve(__dirname, '../ecommerce-automation');
        this.reportDir = path.join(this.automationDir, 'reports');
        this.testFile = path.join(this.automationDir, 'tests/test_e2e_flow.py');
        this.reportFile = path.join(this.reportDir, 'report.html');
    }

    async runTests(targetUrl = null, testType = 'sauce') {
        console.log(`[EcommerceService] runTests called with Type: ${testType}, URL: ${targetUrl}`);
        return new Promise((resolve, reject) => {
            // Ensure report directory exists
            if (!fs.existsSync(this.reportDir)) {
                fs.mkdirSync(this.reportDir, { recursive: true });
            }

            let testScript = this.testFile; // Default to SauceDemo
            let args = '';

            if (testType === 'security') {
                testScript = path.join(this.automationDir, 'tests/test_security_smoke.py');
                if (targetUrl) args = ` --url="${targetUrl}"`;
            } else if (testType === 'universal') {
                testScript = path.join(this.automationDir, 'tests/test_universal_check.py');
                if (targetUrl) args = ` --url="${targetUrl}"`;
            }
            // Removed Flipkart/Amazon as per request - Defaulting to Sauce/E2E

            // Command to run pytest
            const command = `python -m pytest "${testScript}"${args} --html="${this.reportFile}" --self-contained-html --junitxml="${path.join(this.reportDir, 'result.xml')}"`;

            console.log(`[EcommerceService] Executing: ${command}`);

            exec(command, { cwd: this.automationDir }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[EcommerceService] Exec error: ${error.message}`);
                    if (error.code !== 1) { // 1 is test failure, which is acceptable
                        return reject({ message: error.message, stdout, stderr });
                    }
                }

                console.log(`[EcommerceService] Test Execution Completed.`);

                let securityData = null;
                let ecommerceData = null;

                if (testType === 'security') {
                    try {
                        const jsonPath = path.join(this.automationDir, 'reports/security_findings.json');
                        if (fs.existsSync(jsonPath)) {
                            securityData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                        }
                    } catch (err) { console.error("Error reading security findings:", err); }
                } else if (testType === 'sauce') {
                    try {
                        const jsonPath = path.join(this.automationDir, 'reports/e2e_results.json');
                        if (fs.existsSync(jsonPath)) {
                            ecommerceData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                        }
                    } catch (err) { console.error("Error reading e2e results:", err); }
                }

                resolve({
                    success: true,
                    // Keeping reportPath for backward compatibility or debugging, but UI will use JSON
                    reportPath: '/api/ecommerce/reports/report.html',
                    securityData: securityData,
                    ecommerceData: ecommerceData,
                    stdout: stdout,
                    stderr: stderr
                });
            });
        });
    }

    getLatestReport() {
        if (fs.existsSync(this.reportFile)) {
            return '/api/ecommerce/reports/report.html';
        }
        return null;
    }
}

module.exports = new EcommerceService();
