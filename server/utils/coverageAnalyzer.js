const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Run tests with coverage and parse results
 */
const analyzeCoverage = (projectDir) => {
    return new Promise((resolve) => {
        const coverageDir = path.join(projectDir, '.nyc_output');
        const coverageFile = path.join(projectDir, 'coverage', 'coverage-summary.json');

        // Run tests with nyc coverage
        const nycTest = spawn('npx', ['nyc', '--reporter=json-summary', 'npm', 'test'], {
            cwd: projectDir,
            shell: true
        });

        let logs = [];
        nycTest.stdout.on('data', d => logs.push(d.toString()));
        nycTest.stderr.on('data', d => logs.push(d.toString()));

        nycTest.on('close', () => {
            // Try to read coverage summary
            if (fs.existsSync(coverageFile)) {
                try {
                    const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
                    const total = coverage.total;

                    resolve({
                        success: true,
                        coverage: {
                            lines: {
                                covered: total.lines.covered,
                                total: total.lines.total,
                                pct: total.lines.pct
                            },
                            branches: {
                                covered: total.branches.covered,
                                total: total.branches.total,
                                pct: total.branches.pct
                            },
                            functions: {
                                covered: total.functions.covered,
                                total: total.functions.total,
                                pct: total.functions.pct
                            },
                            statements: {
                                covered: total.statements.covered,
                                total: total.statements.total,
                                pct: total.statements.pct
                            }
                        },
                        logs
                    });
                } catch (err) {
                    resolve({ success: false, error: 'Failed to parse coverage', logs });
                }
            } else {
                resolve({ success: false, error: 'No coverage file generated', logs });
            }
        });
    });
};

module.exports = { analyzeCoverage };
