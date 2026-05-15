const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

const seedDemoData = () => {
    console.log('🌱 Starting Demo Data Seeding...');

    db.serialize(() => {
        // Migration: Add project_id to defects if missing
        db.run("ALTER TABLE defects ADD COLUMN project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE", (err) => { });

        // Migration: Add detection_source to defects if missing
        db.run("ALTER TABLE defects ADD COLUMN detection_source TEXT", (err) => { });

        // --- 1. Create User (if not exists) ---
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run("INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ['Admin User', 'admin@meghana.com', hashedPassword, 'Admin'], function (err) {
                if (err) console.error('User creation failed:', err.message);
                else if (this.changes > 0) console.log('✅ Created Admin User: admin@meghana.com / admin123');
                else console.log('ℹ️ Admin User already exists.');
            });

        // --- 2. Create Project ---
        db.run("INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)",
            ['E-Commerce Platform', 'A modern, full-stack e-commerce solution with AI recommendations.', 1], function (err) {
                if (err) return console.error('Project creation failed:', err);
                const projectId = this.lastID;
                console.log(`✅ Created Project: E-Commerce Platform (ID: ${projectId})`);

                // --- 3. Create Modules ---
                const modules = ['Auth', 'Catalog', 'Cart', 'Checkout', 'Payment', 'Admin'];
                const moduleIds = {};
                modules.forEach(mod => {
                    db.run("INSERT INTO modules (project_id, name) VALUES (?, ?)", [projectId, mod], function (err) {
                        moduleIds[mod] = this.lastID;
                    });
                });

                // --- 4. Create Requirements (SRS) ---
                const requirements = [
                    { req_id: 'REQ-001', title: 'User Registration', desc: 'Users must be able to register with email/password.', type: 'Functional', priority: 'High' },
                    { req_id: 'REQ-002', title: 'Product Search', desc: 'Users can search products by name and category.', type: 'Functional', priority: 'Medium' },
                    { req_id: 'REQ-003', title: 'Secure Payments', desc: 'All payments must be processed via Stripe PCI-compliant iframe.', type: 'Non-Functional', priority: 'Critical' },
                    { req_id: 'REQ-004', title: 'Page Load Speed', desc: 'Home page must load under 2 seconds.', type: 'Performance', priority: 'High' }
                ];

                const reqIds = [];
                requirements.forEach(r => {
                    db.run("INSERT INTO requirements (project_id, req_identifier, title, description, type, priority, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [projectId, r.req_id, r.title, r.desc, r.type, r.priority, 'Approved', 1], function (err) {
                            reqIds.push(this.lastID);
                        });
                });

                // --- 5. Create Test Cases ---
                const testCases = [
                    { title: 'Verify Registration', desc: 'Register with valid email.', priority: 'High', reqIdx: 0 },
                    { title: 'Search by Keyword', desc: 'Search for "Laptop".', priority: 'Medium', reqIdx: 1 },
                    { title: 'Verify Stripe Iframe', desc: 'Ensure iframe loads correctly.', priority: 'Critical', reqIdx: 2 },
                    { title: 'Load Testing Home', desc: 'Measure load time.', priority: 'High', reqIdx: 3 }
                ];

                const tcIds = [];
                testCases.forEach(tc => {
                    db.run("INSERT INTO test_cases (project_id, title, description, priority, status, created_by) VALUES (?, ?, ?, ?, ?, ?)",
                        [projectId, tc.title, tc.desc, tc.priority, 'Approved', 1], function (err) {
                            const tcId = this.lastID;
                            tcIds.push(tcId);

                            // Link to Requirement
                            if (reqIds[tc.reqIdx]) {
                                db.run("INSERT INTO requirement_test_cases (requirement_id, test_case_id) VALUES (?, ?)", [reqIds[tc.reqIdx], tcId]);
                            }
                        });
                });

                // --- 6. Create Test Run ---
                const runName = 'Regression Run v2.4';
                db.run("INSERT INTO test_runs (project_id, name, status, executed_by, executed_at) VALUES (?, ?, ?, ?, ?)",
                    [projectId, runName, 'Failed', 1, new Date().toISOString()], function (err) {
                        const runId = this.lastID;
                        console.log(`✅ Created Test Run: ${runName} (ID: ${runId})`);

                        // --- 7. Populate Detailed Results ---

                        // Static Analysis
                        const staticIssues = [
                            { file: 'src/auth.js', line: 42, rule: 'no-eval', message: 'Unexpected use of eval()', severity: 'Error' },
                            { file: 'src/components/Button.jsx', line: 15, rule: 'react/prop-types', message: 'Missing prop validation', severity: 'Warning' }
                        ];
                        staticIssues.forEach(i => {
                            db.run("INSERT INTO static_issues (run_id, file, line, rule, message, severity) VALUES (?, ?, ?, ?, ?, ?)",
                                [runId, i.file, i.line, i.rule, i.message, i.severity]);
                        });
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Static Analysis', 'FAIL', 0, 2, JSON.stringify({ issues: 2 })]);

                        // Security
                        const securityIssues = [
                            { file: 'package.json', rule: 'lodash', description: 'Prototype Pollution in lodash < 4.17.19', severity: 'high' }
                        ];
                        securityIssues.forEach(i => {
                            db.run("INSERT INTO security_issues (run_id, file, rule, description, severity) VALUES (?, ?, ?, ?, ?)",
                                [runId, i.file, i.rule, i.description, i.severity]);
                        });
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Security Scan', 'FAIL', 0, 1, JSON.stringify({ vulnerabilities: 1 })]);

                        // Complexity
                        const complexity = [
                            { file: 'src/utils/helpers.js', complexity: 15, maintainability: 45 },
                            { file: 'src/api/client.js', complexity: 5, maintainability: 85 }
                        ];
                        complexity.forEach(c => {
                            db.run("INSERT INTO complexity_metrics (run_id, file, complexity_score, maintainability_index) VALUES (?, ?, ?, ?)",
                                [runId, c.file, c.complexity, c.maintainability]);
                        });
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Complexity Analysis', 'PASS', 2, 0, JSON.stringify({ files: 2 })]);

                        // Coverage
                        db.run("INSERT INTO coverage_summary (run_id, lines_covered, lines_total, branches_covered, branches_total, functions_covered, functions_total) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            [runId, 450, 500, 80, 100, 45, 50]);
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Code Coverage', 'PASS', 450, 50, JSON.stringify({ pct: 90 })]);

                        // Performance
                        const perfDetails = {
                            avgResponseTime: 120,
                            passed: 18,
                            failed: 2,
                            endpoints: [
                                { method: 'GET', path: '/api/products', responseTime: 85, status: 'PASS' },
                                { method: 'POST', path: '/api/checkout', responseTime: 450, status: 'FAIL' }
                            ]
                        };
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Performance Testing', 'FAIL', 18, 2, JSON.stringify(perfDetails)]);

                        // Integration
                        const intDetails = {
                            total: 10,
                            passed: 9,
                            failed: 1,
                            tests: [
                                { file: 'tests/integration/auth.test.js', status: 'PASS' },
                                { file: 'tests/integration/payment.test.js', status: 'FAIL' }
                            ]
                        };
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Integration Testing', 'FAIL', 9, 1, JSON.stringify(intDetails)]);

                        // Regression
                        const regDetails = {
                            totalRegressions: 1,
                            totalImprovements: 3,
                            comparedWithRun: 'Run #10'
                        };
                        db.run("INSERT INTO test_type_results (run_id, test_type, status, passed, failed, details) VALUES (?, ?, ?, ?, ?, ?)",
                            [runId, 'Regression Testing', 'FAIL', 3, 1, JSON.stringify(regDetails)]);


                        // --- 8. Create Defects ---
                        const defects = [
                            { title: 'Security: Lodash Vulnerability', severity: 'High', priority: 'High', status: 'Open', source: 'Security Scan' },
                            { title: 'Performance: Checkout API Slow', severity: 'Medium', priority: 'Medium', status: 'Open', source: 'Performance Testing' },
                            { title: 'Integration: Payment Flow Failure', severity: 'Critical', priority: 'High', status: 'In Progress', source: 'Integration Testing' }
                        ];

                        defects.forEach(d => {
                            db.run("INSERT INTO defects (project_id, test_run_id, title, description, severity, priority, status, assignee_id, detection_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                                [projectId, runId, d.title, `Auto-detected issue from ${d.source}`, d.severity, d.priority, d.status, 1, d.source]);
                        });

                        console.log('✅ Demo Data Seeded Successfully!');
                    });
            });
    });
};

seedDemoData();
