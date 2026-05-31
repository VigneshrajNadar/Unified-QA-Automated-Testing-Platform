const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

const TestRun = require('../models/TestRun');
const Defect = require('../models/Defect');

const { runTests } = require('../utils/testRunner');

const router = express.Router();

const fs = require('fs');

const tempUploadDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

const upload = multer({
    dest: tempUploadDir,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Real Execution Route
router.post('/execute', upload.single('projectFile'), async (req, res) => {
    const { projectId, selectedTests, gitUrl } = req.body;
    const file = req.file;

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
        inputPath = path.join(__dirname, '../temp_uploads', `git_${Date.now()}`);

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
        const { success, logs, results } = await runTests(inputPath, projectId || 'temp', testsToRun, inputType);

        if (!projectId || projectId === 'temp') {
            return res.status(400).json({
                message: 'Valid project ID is required. Please create a project first.',
                logs: logs,
                results: results
            });
        }

        const runName = `Auto-Run ${new Date().toLocaleString()}`;

        // Save Run to DB
        const testRun = new TestRun({
            project_id: projectId,
            name: runName,
            status: 'Completed',
            created_by: req.user ? req.user.userId : null,
            started_at: Date.now(),
            completed_at: Date.now(),
            metrics: results // Store everything loosely here
        });

        await testRun.save();
        const runId = testRun._id;

        // Auto-Create Defect for Static Errors (Limit to 10 to prevent timeouts)
        if (results.staticAnalysis && results.staticAnalysis.length > 0) {
            let defectCount = 0;
            for (const issue of results.staticAnalysis) {
                if (issue.severity === 'Error' && defectCount < 10) {
                    defectCount++;
                    const steps = `1. Open file ${issue.file}\n2. Go to line ${issue.line}\n3. Observe code violation for rule ${issue.rule}`;
                    const expected = `Code should comply with rule ${issue.rule}`;
                    const actual = `Code violates rule: ${issue.message}`;

                    await new Defect({
                        project_id: projectId,
                        test_run_id: runId,
                        title: `Static Analysis Error: ${issue.rule}`,
                        description: `${issue.message} in ${issue.file}:${issue.line}`,
                        severity: 'Medium',
                        priority: 'Medium',
                        status: 'Open',
                        assignee_id: req.user ? req.user.userId : null,
                        steps,
                        expected_result: expected,
                        actual_result: actual,
                        detection_source: 'Static Analysis'
                    }).save();
                }
            }
        }

        // Auto-Create Defect for Security Vulnerabilities (Limit to 10)
        if (results.security && results.security.length > 0) {
            let securityDefectCount = 0;
            for (const issue of results.security) {
                if ((issue.severity === 'high' || issue.severity === 'critical') && securityDefectCount < 10) {
                    securityDefectCount++;
                    await new Defect({
                        project_id: projectId,
                        test_run_id: runId,
                        title: `Security Vulnerability: ${issue.rule}`,
                        description: issue.description,
                        severity: 'High',
                        priority: 'High',
                        status: 'Open',
                        assignee_id: req.user ? req.user.userId : null,
                        steps: `1. Check package.json dependencies\n2. Run 'npm audit' locally\n3. Observe vulnerability in package ${issue.rule}`,
                        expected_result: `Package ${issue.rule} should be secure`,
                        actual_result: `Package has ${issue.severity} vulnerability: ${issue.description}`,
                        detection_source: 'Security Scan'
                    }).save();
                }
            }
        }

        // Auto-Create Defect for Complexity
        if (results.complexity && results.complexity.length > 0) {
            for (const metric of results.complexity) {
                if (metric.complexity > 10) {
                    const steps = `1. Open file ${metric.file}\n2. Analyze function complexity`;
                    const expected = `Cyclomatic complexity should be <= 10`;
                    const actual = `Cyclomatic complexity is ${metric.complexity}`;

                    await new Defect({
                        project_id: projectId,
                        test_run_id: runId,
                        title: `High Complexity: ${metric.file}`,
                        description: `Cyclomatic complexity of ${metric.complexity} exceeds threshold of 10`,
                        severity: 'Low',
                        priority: 'Low',
                        status: 'Open',
                        assignee_id: req.user ? req.user.userId : null,
                        steps,
                        expected_result: expected,
                        actual_result: actual,
                        detection_source: 'Complexity Analysis'
                    }).save();
                }
            }
        }

        // Auto-Create Defect for Low Coverage
        if (results.coverage && results.coverage.lines && results.coverage.lines.pct < 60) {
            const steps = `1. Run test suite with coverage\n2. Check coverage report`;
            const expected = `Line coverage should be >= 60%`;
            const actual = `Line coverage is ${results.coverage.lines.pct}%`;

            await new Defect({
                project_id: projectId,
                test_run_id: runId,
                title: `Low Code Coverage`,
                description: `Line coverage is ${results.coverage.lines.pct}%, below 60% threshold`,
                severity: 'Medium',
                priority: 'Medium',
                status: 'Open',
                assignee_id: req.user ? req.user.userId : null,
                steps,
                expected_result: expected,
                actual_result: actual,
                detection_source: 'Coverage Analysis'
            }).save();
        }

        // Fallbacks for frontend
        if (testsToRun.includes('static') && (!results.staticAnalysis || results.staticAnalysis.length === 0)) results.staticAnalysis = [];
        if (testsToRun.includes('security') && (!results.security || results.security.length === 0)) results.security = [];
        if (testsToRun.includes('complexity') && (!results.complexity || results.complexity.length === 0)) results.complexity = [];
        if (testsToRun.includes('coverage') && !results.coverage) {
            results.coverage = {
                lines: { pct: 0, covered: 0, total: 0 },
                branches: { pct: 0, covered: 0, total: 0 },
                functions: { pct: 0, covered: 0, total: 0 }
            };
        }
        if (testsToRun.includes('performance') && !results.performance) {
            results.performance = { tested: false, message: 'No server found', summary: { total: 0, passed: 0, failed: 0 }, endpoints: [] };
        }
        if (testsToRun.includes('integration') && !results.integration) {
            results.integration = { tested: false, message: 'No tests found', summary: { total: 0, passed: 0, failed: 0 }, tests: [] };
        }
        if (testsToRun.includes('regression') && !results.regression) {
            results.regression = { tested: false, message: 'No data', summary: { totalRegressions: 0, totalImprovements: 0 } };
        }
        if (testsToRun.includes('unit') && !results.unitTests) {
            results.unitTests = { total: 0, passed: 0, failed: 0, message: 'No tests found' };
        }

        testRun.metrics = results;
        await testRun.save(); // Save again if fallbacks changed it

        res.json({
            message: 'Execution Complete',
            success: success,
            runId: runId,
            logs: logs,
            results: results
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Execution Failed', error: err.message });
    }
});

module.exports = router;
