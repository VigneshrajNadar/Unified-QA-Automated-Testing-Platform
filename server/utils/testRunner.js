const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');
const { detectProject } = require('./projectDetector');
const { discoverTests } = require('./testDiscovery');
const { analyzeComplexity } = require('./complexityAnalyzer');
const { runPerformanceTests } = require('./performanceTester');
const { runIntegrationTests } = require('./integrationTester');
const { runRegressionTests } = require('./regressionTester');
const EXTRACT_PATH = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(EXTRACT_PATH)) {
    fs.mkdirSync(EXTRACT_PATH, { recursive: true });
}

const runTests = (inputPath, projectId, selectedTests = [], inputType = 'zip') => {
    return new Promise((resolve, reject) => {
        let projectDir;

        try {
            if (inputType === 'zip') {
                projectDir = path.join(EXTRACT_PATH, `project_${projectId}_${Date.now()}`);
                // 1. Unzip
                const zip = new AdmZip(inputPath);
                zip.extractAllTo(projectDir, true);
                console.log(`Extracted to ${projectDir}`);
            } else {
                // For directory input (e.g. git clone), use it directly
                projectDir = inputPath;
                console.log(`Using directory: ${projectDir}`);
            }

            // Check if zip/dir has a root folder
            const files = fs.readdirSync(projectDir);
            let actualProjectDir = projectDir;
            if (files.length === 1 && fs.lstatSync(path.join(projectDir, files[0])).isDirectory()) {
                actualProjectDir = path.join(projectDir, files[0]);
            }

            // 2. Detect Project Type
            const projectInfo = detectProject(actualProjectDir);
            console.log('Detected project:', projectInfo);

            if (!projectInfo.language) {
                return reject(new Error('Unable to detect project type. Supported: Node.js, Python, Java'));
            }

            // 3. Discover Tests
            const testDiscovery = discoverTests(actualProjectDir, projectInfo.language);
            console.log(`Found ${testDiscovery.totalFiles} test files`);

            // Default to all core tests if none selected
            if (!selectedTests || selectedTests.length === 0) {
                selectedTests = ['unit', 'static', 'security', 'complexity', 'coverage'];
            }

            // 4. Run appropriate pipeline
            if (projectInfo.language === 'JavaScript/Node.js') {
                runNodePipeline(actualProjectDir, projectInfo, testDiscovery, selectedTests, projectId, resolve, reject);
            } else if (projectInfo.language === 'Python') {
                runPythonPipeline(actualProjectDir, projectInfo, testDiscovery, selectedTests, resolve, reject);
            } else if (projectInfo.language === 'Java') {
                runJavaPipeline(actualProjectDir, projectInfo, testDiscovery, selectedTests, resolve, reject);
            } else {
                reject(new Error(`Unsupported language: ${projectInfo.language}`));
            }

        } catch (err) {
            reject(err);
        }
    });
};

const runNodePipeline = async (cwd, projectInfo, testDiscovery, selectedTests, projectId, resolve, reject) => {
    let logs = [];
    let results = {
        projectInfo,
        testDiscovery,
        staticAnalysis: [],
        security: [],
        complexity: [],
        coverage: null,
        unitTests: { passed: 0, failed: 0, total: 0 },
        performance: null,
        integration: null,
        regression: null
    };

    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    log('=== Phase 1: Installing Dependencies ===');
    const install = spawn('npm', ['install'], { cwd, shell: true });
    install.stdout.on('data', d => log(`[Install]: ${d.toString().trim()}`));
    install.stderr.on('data', d => log(`[Install]: ${d.toString().trim()}`));

    install.on('close', async (code) => {
        if (code !== 0) {
            log('Warning: Installation had issues, continuing...');
        }

        // Phase 2: Complexity Analysis
        if (selectedTests.includes('complexity')) {
            log('\n=== Phase 2: Complexity Analysis ===');
            try {
                results.complexity = analyzeComplexity(cwd);
                log(`Analyzed ${results.complexity.length} files for complexity`);
            } catch (e) {
                log(`Complexity analysis skipped: ${e.message}`);
            }
        }

        // Phase 3: Static Code Analysis (ESLint)
        if (selectedTests.includes('static')) {
            log('\n=== Phase 3: Static Code Analysis (ESLint) ===');
            await new Promise(resolveLint => {
                const lint = spawn('npx', ['--yes', 'eslint', '.', '--format', 'json'], { cwd, shell: true });
                let lintOutput = '';
                lint.stdout.on('data', d => { lintOutput += d; });
                lint.stderr.on('data', d => log(`[ESLint]: ${d.toString().trim()}`));

                lint.on('close', () => {
                    try {
                        const parsed = JSON.parse(lintOutput);
                        results.staticAnalysis = parsed.flatMap(f => f.messages.map(m => ({
                            file: f.filePath.replace(cwd, '').replace(/\\/g, '/'),
                            line: m.line,
                            column: m.column,
                            message: m.message,
                            rule: m.ruleId || 'unknown',
                            severity: m.severity === 2 ? 'Error' : 'Warning'
                        })));
                        log(`Found ${results.staticAnalysis.length} static analysis issues`);
                    } catch (e) {
                        log('ESLint not configured or failed to parse. Skipping.');
                    }
                    resolveLint();
                });
            });
        }

        // Phase 4: Security Scan (npm audit)
        if (selectedTests.includes('security')) {
            log('\n=== Phase 4: Security Scan (npm audit) ===');
            await new Promise(resolveAudit => {
                const audit = spawn('npm', ['audit', '--json'], { cwd, shell: true });
                let auditOutput = '';
                audit.stdout.on('data', d => { auditOutput += d; });

                audit.on('close', () => {
                    try {
                        const parsed = JSON.parse(auditOutput);
                        if (parsed.vulnerabilities) {
                            Object.entries(parsed.vulnerabilities).forEach(([name, v]) => {
                                results.security.push({
                                    severity: v.severity,
                                    rule: name,
                                    description: `${v.severity} vulnerability in ${name}`,
                                    file: 'package.json',
                                    via: v.via?.map(x => typeof x === 'string' ? x : x.title).join(', ') || 'N/A'
                                });
                            });
                        }
                        log(`Found ${results.security.length} security vulnerabilities`);
                    } catch (e) {
                        log('Security scan completed with no parseable output');
                    }
                    resolveAudit();
                });
            });
        }

        // Phase 5: Unit Testing with Coverage
        if (selectedTests.includes('unit') || selectedTests.includes('coverage')) {
            log('\n=== Phase 5: Unit Testing with Coverage ===');
            if (projectInfo.hasTests) {
                await new Promise(resolveTest => {
                    const cmd = selectedTests.includes('coverage') ? 'nyc' : 'npm';
                    const args = selectedTests.includes('coverage')
                        ? ['--reporter=json-summary', '--reporter=text', 'npm', 'test']
                        : ['test'];

                    const test = spawn('npx', ['--yes', cmd, ...args], { cwd, shell: true });
                    test.stdout.on('data', d => log(`[Test]: ${d.toString().trim()}`));
                    test.stderr.on('data', d => log(`[Test]: ${d.toString().trim()}`));

                    test.on('close', (testCode) => {
                        log(`\nTest process finished with code ${testCode}`);

                        if (selectedTests.includes('coverage')) {
                            const coverageFile = path.join(cwd, 'coverage', 'coverage-summary.json');
                            if (fs.existsSync(coverageFile)) {
                                try {
                                    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
                                    results.coverage = coverage.total;
                                    log(`Coverage: ${results.coverage.lines.pct}% lines, ${results.coverage.branches.pct}% branches`);
                                } catch (e) {
                                    log('Could not parse coverage data');
                                }
                            }
                        }

                        results.unitTests.total = testDiscovery.totalFiles;
                        results.unitTests.passed = testCode === 0 ? testDiscovery.totalFiles : 0;
                        results.unitTests.failed = testCode === 0 ? 0 : testDiscovery.totalFiles;
                        resolveTest();
                    });
                });
            } else {
                log('No tests found to execute');
            }
        }

        // Phase 6: Performance Testing
        if (selectedTests.includes('performance')) {
            log('\n=== Phase 6: Performance Testing ===');
            results.performance = await runPerformanceTests(cwd);
            if (results.performance.tested) {
                log(`Performance: ${results.performance.summary.passed}/${results.performance.summary.total} endpoints passed threshold`);
            } else {
                log(`Performance test skipped: ${results.performance.message || 'No endpoints'}`);
            }
        }

        // Phase 7: Integration Testing
        if (selectedTests.includes('integration')) {
            log('\n=== Phase 7: Integration Testing ===');
            results.integration = await runIntegrationTests(cwd);
            if (results.integration.tested) {
                log(`Integration: ${results.integration.summary.passed}/${results.integration.summary.total} tests passed`);
            } else {
                log(`Integration test skipped: ${results.integration.message || 'No tests found'}`);
            }
        }

        // Phase 8: Regression Testing
        if (selectedTests.includes('regression')) {
            log('\n=== Phase 8: Regression Testing ===');
            // Note: Regression needs current results, so we pass what we have so far
            // In a real scenario, we might need to re-run previous tests, but here we compare current run with previous
            results.regression = await runRegressionTests(projectId, {
                defects: [
                    ...results.staticAnalysis.map(i => ({ title: `Static Analysis Error: ${i.rule}`, severity: 'Medium' })),
                    ...results.security.map(i => ({ title: `Security Vulnerability: ${i.rule}`, severity: 'High' }))
                ]
            });
            if (results.regression.tested) {
                log(`Regression: Found ${results.regression.summary.totalRegressions} new defects and ${results.regression.summary.totalImprovements} fixes`);
            } else {
                log(`Regression test skipped: ${results.regression.message}`);
            }
        }

        resolve({ success: true, logs, results });
    });
};

const runPythonPipeline = (cwd, projectInfo, testDiscovery, selectedTests, resolve, reject) => {
    // Simplified Python pipeline
    let logs = ['Python testing pipeline not fully implemented yet'];
    let results = { projectInfo, testDiscovery };
    resolve({ success: true, logs, results });
};

const runJavaPipeline = (cwd, projectInfo, testDiscovery, selectedTests, resolve, reject) => {
    // Simplified Java pipeline
    let logs = ['Java testing pipeline not fully implemented yet'];
    let results = { projectInfo, testDiscovery };
    resolve({ success: true, logs, results });
};

module.exports = { runTests };
