const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Integration Testing Utility
 * Detects and runs integration tests
 */

const runIntegrationTests = async (projectPath) => {
    const results = {
        tested: false,
        tests: [],
        summary: {
            total: 0,
            passed: 0,
            failed: 0,
            duration: 0
        }
    };

    try {
        // Find integration test files
        const integrationTestFiles = await findIntegrationTests(projectPath);

        if (integrationTestFiles.length === 0) {
            return { ...results, message: 'No integration tests found' };
        }

        results.tested = true;
        const startTime = Date.now();

        // Run integration tests
        const testOutput = await executeIntegrationTests(projectPath, integrationTestFiles);

        results.summary.duration = Date.now() - startTime;
        results.tests = testOutput.tests;
        results.summary.total = testOutput.total;
        results.summary.passed = testOutput.passed;
        results.summary.failed = testOutput.failed;

        return results;
    } catch (error) {
        return { ...results, error: error.message };
    }
};

/**
 * Find integration test files
 */
const findIntegrationTests = async (projectPath) => {
    const integrationTests = [];

    const searchPatterns = [
        '.integration.test.js',
        '.integration.spec.js',
        '.integration.test.ts',
        '.integration.spec.ts',
        'integration.test.js',
        'integration.spec.js'
    ];

    const searchDir = (dir) => {
        try {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            files.forEach(file => {
                const fullPath = path.join(dir, file.name);
                if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
                    searchDir(fullPath);
                } else if (file.isFile()) {
                    const matchesPattern = searchPatterns.some(pattern => file.name.includes(pattern));
                    if (matchesPattern) {
                        integrationTests.push(fullPath);
                    }
                }
            });
        } catch (err) {
            // Skip directories that can't be read
        }
    };

    searchDir(projectPath);
    return integrationTests;
};

/**
 * Execute integration tests
 */
const executeIntegrationTests = (projectPath, testFiles) => {
    return new Promise((resolve) => {
        const testCommand = 'npm';
        const testArgs = ['test', '--', ...testFiles.map(f => path.relative(projectPath, f))];

        const proc = spawn(testCommand, testArgs, {
            cwd: projectPath,
            shell: true
        });

        let output = '';
        let errorOutput = '';

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('close', (code) => {
            // Parse test results (simplified)
            const results = {
                tests: [],
                total: testFiles.length,
                passed: code === 0 ? testFiles.length : 0,
                failed: code === 0 ? 0 : testFiles.length
            };

            testFiles.forEach(file => {
                results.tests.push({
                    file: path.basename(file),
                    status: code === 0 ? 'PASS' : 'FAIL',
                    passed: code === 0
                });
            });

            resolve(results);
        });
    });
};

module.exports = { runIntegrationTests };
