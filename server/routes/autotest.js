const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { runTests } = require('../utils/testRunner');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Configure Multer for Zip Uploads
const upload = multer({
    dest: path.join(__dirname, '../../temp_uploads'),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const { spawn } = require('child_process');

// Real Execution Route
router.post('/execute', upload.single('projectFile'), async (req, res) => {
    const { projectId, selectedTests, gitUrl } = req.body;
    const file = req.file;

    // Parse selectedTests if it comes as a string (from FormData)
    let testsToRun = [];
    if (selectedTests) {
        try {
            testsToRun = typeof selectedTests === 'string' ? JSON.parse(selectedTests) : selectedTests;
        } catch (e) {
            testsToRun = selectedTests.split(',');
        }
    }

    let inputPath = null;
    let inputType = 'zip';

    if (file) {
        inputPath = file.path;
    } else if (gitUrl) {
        inputType = 'dir';
        inputPath = path.join(__dirname, '../../temp_uploads', `git_${Date.now()}`);

        try {
            await new Promise((resolve, reject) => {
                const git = spawn('git', ['clone', gitUrl, inputPath]);
                git.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error('Git clone failed'));
                });
            });
        } catch (err) {
            return res.status(400).json({ message: 'Failed to clone GitHub repository', error: err.message });
        }
    } else {
        return res.status(400).json({ message: 'No project file or GitHub URL provided.' });
    }

    try {
        // Run the Test Runner
        const { success, logs, results } = await runTests(inputPath, projectId || 'temp', testsToRun, inputType);

        // Validate projectId
        if (!projectId || projectId === 'temp') {
            return res.status(400).json({
                message: 'Valid project ID is required. Please create a project first.',
                logs: logs,
                results: results
            });
        }

        // Save Run to DB
        const runName = `Auto-Run ${new Date().toLocaleString()}`;

        db.run(`INSERT INTO test_runs (project_id, name, executed_by, executed_at) VALUES (?, ?, ?, ?)`,
            [parseInt(projectId), runName, req.user.userId, new Date().toISOString()],
            function (err) {
                if (err) {
                    console.error('DB Error saving test run:', err);
                    console.error('Attempted values:', { projectId, runName, userId: req.user.userId });
                    return res.status(500).json({
                        message: 'Database error saving run',
                        error: err.message,
                        details: 'Please ensure the project exists and you have proper permissions',
                        logs: logs,
                        results: results
                    });
                }
                const runId = this.lastID;

                // Helper to save test type results
                const saveTestTypeResult = (type, status, passed, failed, details) => {
                    db.run(`INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)`,
                        [runId, type, status, passed, failed, JSON.stringify(details)]);
                };

                // Save Static Issues
                if (results.staticAnalysis && results.staticAnalysis.length > 0) {
                    const stmt = db.prepare(`INSERT INTO static_issues (run_id, file, line, message, rule, severity) VALUES (?, ?, ?, ?, ?, ?)`);
                    results.staticAnalysis.forEach(issue => {
                        stmt.run(runId, issue.file, issue.line, issue.message, issue.rule, issue.severity);

                        // Auto-Create Defect for Errors
                        if (issue.severity === 'Error') {
                            const steps = `1. Open file ${issue.file}\n2. Go to line ${issue.line}\n3. Observe code violation for rule ${issue.rule}`;
                            const expected = `Code should comply with rule ${issue.rule}`;
                            const actual = `Code violates rule: ${issue.message}`;

                            db.run(`INSERT INTO defects (project_id, test_run_id, title, description, severity, priority, status, assignee_id, steps, expected_result, actual_result, detection_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [projectId, runId, `Static Analysis Error: ${issue.rule}`, `${issue.message} in ${issue.file}:${issue.line}`, 'Medium', 'Medium', 'Open', req.user.userId, steps, expected, actual, 'Static Analysis']);
                        }
                    });
                    stmt.finalize();
                    saveTestTypeResult('Static Analysis', 'FAIL', 0, results.staticAnalysis.length, { issues: results.staticAnalysis.length });
                } else if (testsToRun.includes('static')) {
                    saveTestTypeResult('Static Analysis', 'PASS', 1, 0, { message: 'No issues found' });
                }

                // Save Security Issues
                if (results.security && results.security.length > 0) {
                    const stmt = db.prepare(`INSERT INTO security_issues (run_id, file, severity, rule, description) VALUES (?, ?, ?, ?, ?)`);
                    results.security.forEach(issue => {
                        stmt.run(runId, issue.file, issue.severity, issue.rule, issue.description);

                        // Auto-Create Defect for High/Critical Vulnerabilities
                        if (issue.severity === 'high' || issue.severity === 'critical') {
                            const steps = `1. Check package.json dependencies\n2. Run 'npm audit' locally\n3. Observe vulnerability in package ${issue.rule}`;
                            const expected = `Package ${issue.rule} should be secure`;
                            const actual = `Package has ${issue.severity} vulnerability: ${issue.description}`;

                            db.run(`INSERT INTO defects (project_id, test_run_id, title, description, severity, priority, status, assignee_id, steps, expected_result, actual_result, detection_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [projectId, runId, `Security Vulnerability: ${issue.rule}`, issue.description, 'High', 'High', 'Open', req.user.userId, steps, expected, actual, 'Security Scan']);
                        }
                    });
                    stmt.finalize();
                    saveTestTypeResult('Security Scan', 'FAIL', 0, results.security.length, { vulnerabilities: results.security.length });
                } else if (testsToRun.includes('security')) {
                    saveTestTypeResult('Security Scan', 'PASS', 1, 0, { message: 'No vulnerabilities found' });
                }

                // Save Complexity Metrics
                if (results.complexity && results.complexity.length > 0) {
                    const stmt = db.prepare(`INSERT INTO complexity_metrics (run_id, file, complexity_score, maintainability_index) VALUES (?, ?, ?, ?)`);
                    results.complexity.forEach(metric => {
                        stmt.run(runId, metric.file, metric.complexity, metric.maintainability);

                        // Auto-Create Defect for High Complexity
                        if (metric.complexity > 10) {
                            const steps = `1. Open file ${metric.file}\n2. Analyze function complexity`;
                            const expected = `Cyclomatic complexity should be <= 10`;
                            const actual = `Cyclomatic complexity is ${metric.complexity}`;

                            db.run(`INSERT INTO defects (project_id, test_run_id, title, description, severity, priority, status, assignee_id, steps, expected_result, actual_result, detection_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [projectId, runId, `High Complexity: ${metric.file}`, `Cyclomatic complexity of ${metric.complexity} exceeds threshold of 10`, 'Low', 'Low', 'Open', req.user.userId, steps, expected, actual, 'Complexity Analysis']);
                        }
                    });
                    stmt.finalize();
                    saveTestTypeResult('Complexity Analysis', 'PASS', results.complexity.length, 0, { files: results.complexity.length });
                }

                // Save Coverage Summary
                if (results.coverage) {
                    db.run(`INSERT INTO coverage_summary (run_id, lines_covered, lines_total, branches_covered, branches_total, functions_covered, functions_total) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [runId,
                            results.coverage.lines.covered,
                            results.coverage.lines.total,
                            results.coverage.branches.covered,
                            results.coverage.branches.total,
                            results.coverage.functions.covered,
                            results.coverage.functions.total]);

                    // Auto-Create Defect for Low Coverage
                    if (results.coverage.lines.pct < 60) {
                        const steps = `1. Run test suite with coverage\n2. Check coverage report`;
                        const expected = `Line coverage should be >= 60%`;
                        const actual = `Line coverage is ${results.coverage.lines.pct}%`;

                        db.run(`INSERT INTO defects (project_id, test_run_id, title, description, severity, priority, status, assignee_id, steps, expected_result, actual_result, detection_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [projectId, runId, `Low Code Coverage`, `Line coverage is ${results.coverage.lines.pct}%, below 60% threshold`, 'Medium', 'Medium', 'Open', req.user.userId, steps, expected, actual, 'Coverage Analysis']);
                    }
                    saveTestTypeResult('Code Coverage', results.coverage.lines.pct >= 60 ? 'PASS' : 'FAIL', results.coverage.lines.covered, results.coverage.lines.total - results.coverage.lines.covered, { pct: results.coverage.lines.pct });
                }

                // Save Performance Results
                if (results.performance && results.performance.tested) {
                    saveTestTypeResult('Performance Testing',
                        results.performance.summary.failed === 0 ? 'PASS' : 'FAIL',
                        results.performance.summary.passed,
                        results.performance.summary.failed,
                        results.performance.summary
                    );
                }

                // Save Integration Results
                if (results.integration && results.integration.tested) {
                    saveTestTypeResult('Integration Testing',
                        results.integration.summary.failed === 0 ? 'PASS' : 'FAIL',
                        results.integration.summary.passed,
                        results.integration.summary.failed,
                        results.integration.summary
                    );
                }

                // Save Regression Results
                if (results.regression && results.regression.tested) {
                    const status = results.regression.summary.totalRegressions === 0 ? 'PASS' : 'FAIL';
                    saveTestTypeResult('Regression Testing', status,
                        results.regression.summary.totalImprovements,
                        results.regression.summary.totalRegressions,
                        results.regression.summary
                    );
                }

                // Ensure all selected tests have results (even if empty)
                if (testsToRun.includes('static') && (!results.staticAnalysis || results.staticAnalysis.length === 0)) {
                    results.staticAnalysis = [];
                    log('Static Analysis: No issues found');
                }

                if (testsToRun.includes('security') && (!results.security || results.security.length === 0)) {
                    results.security = [];
                    log('Security Scan: No vulnerabilities found');
                }

                if (testsToRun.includes('complexity') && (!results.complexity || results.complexity.length === 0)) {
                    results.complexity = [];
                    log('Complexity Analysis: No files analyzed or all below threshold');
                }

                if (testsToRun.includes('coverage') && !results.coverage) {
                    results.coverage = {
                        lines: { pct: 0, covered: 0, total: 0 },
                        branches: { pct: 0, covered: 0, total: 0 },
                        functions: { pct: 0, covered: 0, total: 0 }
                    };
                    log('Coverage: No coverage data available');
                }

                if (testsToRun.includes('performance') && !results.performance) {
                    results.performance = {
                        tested: false,
                        message: 'No server found or endpoints could not be detected',
                        summary: { total: 0, passed: 0, failed: 0 },
                        endpoints: []
                    };
                }

                if (testsToRun.includes('integration') && !results.integration) {
                    results.integration = {
                        tested: false,
                        message: 'No integration tests found',
                        summary: { total: 0, passed: 0, failed: 0 },
                        tests: []
                    };
                }

                if (testsToRun.includes('regression') && !results.regression) {
                    results.regression = {
                        tested: false,
                        message: 'No previous run data for comparison',
                        summary: { totalRegressions: 0, totalImprovements: 0 }
                    };
                }

                if (testsToRun.includes('unit') && !results.unitTests) {
                    results.unitTests = {
                        total: 0,
                        passed: 0,
                        failed: 0,
                        message: 'No unit tests found'
                    };
                }

                res.json({
                    message: 'Execution Complete',
                    success: success,
                    runId: runId,
                    logs: logs,
                    results: results
                });
            }
        );

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Execution Failed', error: err.message });
    }
});

module.exports = router;
