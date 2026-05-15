const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('Admin', 'QA Lead', 'Tester')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Projects Table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
            project_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_by INTEGER,
            assignee_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(user_id),
            FOREIGN KEY (assignee_id) REFERENCES users(user_id)
        )`);

        // Modules Table
        db.run(`CREATE TABLE IF NOT EXISTS modules (
            module_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Test Types Table
        db.run(`CREATE TABLE IF NOT EXISTS test_types (
            test_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )`, (err) => {
            if (!err) {
                // Seed Test Types
                const types = [
                    'Unit', 'Integration', 'System', 'Regression', 'Smoke', 'Sanity', 'UAT',
                    'White Box', 'Black Box', 'Grey Box',
                    'Functional', 'Non-Functional', 'Performance', 'Security',
                    'Usability', 'Compatibility', 'Alpha', 'Beta'
                ];
                const stmt = db.prepare(`INSERT OR IGNORE INTO test_types (name) VALUES (?)`);
                types.forEach(type => {
                    stmt.run(type);
                });
                stmt.finalize();
                console.log('Test types seeded.');
            }
        });

        // Test Cases Table
        db.run(`CREATE TABLE IF NOT EXISTS test_cases (
            test_case_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            module_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            preconditions TEXT,
            steps TEXT,
            expected_result TEXT,
            priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
            status TEXT CHECK(status IN ('Draft', 'Approved', 'Deprecated')) DEFAULT 'Draft',
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(user_id)
        )`);

        // Test Case Types Mapping Table
        db.run(`CREATE TABLE IF NOT EXISTS test_case_types (
            test_case_id INTEGER,
            test_type_id INTEGER,
            PRIMARY KEY (test_case_id, test_type_id),
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE,
            FOREIGN KEY (test_type_id) REFERENCES test_types(test_type_id) ON DELETE CASCADE
        )`);

        // Test Suites Table
        db.run(`CREATE TABLE IF NOT EXISTS test_suites (
            test_suite_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Test Suite Cases Mapping Table
        db.run(`CREATE TABLE IF NOT EXISTS test_suite_cases (
            test_suite_id INTEGER,
            test_case_id INTEGER,
            PRIMARY KEY (test_suite_id, test_case_id),
            FOREIGN KEY (test_suite_id) REFERENCES test_suites(test_suite_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE
        )`);

        // Test Runs Table
        db.run(`CREATE TABLE IF NOT EXISTS test_runs (
            test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            test_suite_id INTEGER,
            name TEXT NOT NULL,
            executed_by INTEGER,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (test_suite_id) REFERENCES test_suites(test_suite_id) ON DELETE SET NULL,
            FOREIGN KEY (executed_by) REFERENCES users(user_id)
        )`);

        // Test Run Results Table
        db.run(`CREATE TABLE IF NOT EXISTS test_run_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_run_id INTEGER NOT NULL,
            test_case_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('Pass', 'Fail', 'Blocked', 'Not Run')) DEFAULT 'Not Run',
            actual_result TEXT,
            comments TEXT,
            FOREIGN KEY (test_run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE
        )`);

        // Defects Table
        db.run(`CREATE TABLE IF NOT EXISTS defects (
            defect_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            test_case_id INTEGER,
            test_run_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')),
            priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
            status TEXT CHECK(status IN ('Open', 'In Progress', 'Retest', 'Closed')) DEFAULT 'Open',
            assignee_id INTEGER,
            steps TEXT,
            expected_result TEXT,
            actual_result TEXT,
            detection_source TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE SET NULL,
            FOREIGN KEY (test_run_id) REFERENCES test_runs(test_run_id) ON DELETE SET NULL,
            FOREIGN KEY (assignee_id) REFERENCES users(user_id)
        )`);

        // Attachments Table
        db.run(`CREATE TABLE IF NOT EXISTS attachments (
            attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT CHECK(entity_type IN ('test_case', 'test_run_result', 'defect')),
            entity_id INTEGER,
            file_path TEXT NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Requirements Table
        db.run(`CREATE TABLE IF NOT EXISTS requirements (
            requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            req_identifier TEXT,
            title TEXT,
            description TEXT NOT NULL,
            type TEXT,
            priority TEXT,
            status TEXT DEFAULT 'Draft',
            version TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            parent_id INTEGER,
            category TEXT,
            urgency TEXT,
            business_value INTEGER,
            author_id INTEGER,
            assigned_to INTEGER,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(user_id)
        )`);

        // Requirement Versions Table
        db.run(`CREATE TABLE IF NOT EXISTS requirement_versions (
            version_id INTEGER PRIMARY KEY AUTOINCREMENT,
            requirement_id INTEGER,
            version_number INTEGER,
            title TEXT,
            description TEXT,
            changed_by INTEGER,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            change_reason TEXT,
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE
        )`);

        // Requirement Comments Table
        db.run(`CREATE TABLE IF NOT EXISTS requirement_comments (
            comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            requirement_id INTEGER,
            user_id INTEGER,
            comment_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )`);

        // Requirement Test Case Mapping
        db.run(`CREATE TABLE IF NOT EXISTS requirement_test_cases (
            requirement_id INTEGER,
            test_case_id INTEGER,
            PRIMARY KEY (requirement_id, test_case_id),
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE
        )`);

        // Static Issues Table
        db.run(`CREATE TABLE IF NOT EXISTS static_issues (
            issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file TEXT,
            line INTEGER,
            message TEXT,
            rule TEXT,
            severity TEXT,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Security Issues Table
        db.run(`CREATE TABLE IF NOT EXISTS security_issues (
            issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file TEXT,
            severity TEXT,
            rule TEXT,
            description TEXT,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Complexity Metrics Table
        db.run(`CREATE TABLE IF NOT EXISTS complexity_metrics (
            metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file TEXT,
            complexity_score REAL,
            maintainability_index REAL,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Coverage Summary Table
        db.run(`CREATE TABLE IF NOT EXISTS coverage_summary (
            summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            lines_covered INTEGER,
            lines_total INTEGER,
            branches_covered INTEGER,
            branches_total INTEGER,
            functions_covered INTEGER,
            functions_total INTEGER,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Test Type Results Table
        db.run(`CREATE TABLE IF NOT EXISTS test_type_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            test_type TEXT,
            status TEXT CHECK(status IN ('PASS', 'FAIL', 'SKIP', 'ERROR')),
            passed INTEGER DEFAULT 0,
            failed INTEGER DEFAULT 0,
            duration_ms INTEGER,
        )`, (err) => {
            if (!err) {
                // Seed Test Types
                const types = [
                    'Unit', 'Integration', 'System', 'Regression', 'Smoke', 'Sanity', 'UAT',
                    'White Box', 'Black Box', 'Grey Box',
                    'Functional', 'Non-Functional', 'Performance', 'Security',
                    'Usability', 'Compatibility', 'Alpha', 'Beta'
                ];
                const stmt = db.prepare(`INSERT OR IGNORE INTO test_types (name) VALUES (?)`);
                types.forEach(type => {
                    stmt.run(type);
                });
                stmt.finalize();
                console.log('Test types seeded.');
            }
        });

        // Test Cases Table
        db.run(`CREATE TABLE IF NOT EXISTS test_cases (
            test_case_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            module_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            preconditions TEXT,
            steps TEXT,
            expected_result TEXT,
            priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
            status TEXT CHECK(status IN ('Draft', 'Approved', 'Deprecated')) DEFAULT 'Draft',
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(user_id)
        )`);

        // Test Case Types Mapping Table
        db.run(`CREATE TABLE IF NOT EXISTS test_case_types (
            test_case_id INTEGER,
            test_type_id INTEGER,
            PRIMARY KEY (test_case_id, test_type_id),
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE,
            FOREIGN KEY (test_type_id) REFERENCES test_types(test_type_id) ON DELETE CASCADE
        )`);

        // Test Suites Table
        db.run(`CREATE TABLE IF NOT EXISTS test_suites (
            test_suite_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Test Suite Cases Mapping Table
        db.run(`CREATE TABLE IF NOT EXISTS test_suite_cases (
            test_suite_id INTEGER,
            test_case_id INTEGER,
            PRIMARY KEY (test_suite_id, test_case_id),
            FOREIGN KEY (test_suite_id) REFERENCES test_suites(test_suite_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE
        )`);

        // Test Runs Table
        db.run(`CREATE TABLE IF NOT EXISTS test_runs (
            test_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            test_suite_id INTEGER,
            name TEXT NOT NULL,
            executed_by INTEGER,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (test_suite_id) REFERENCES test_suites(test_suite_id) ON DELETE SET NULL,
            FOREIGN KEY (executed_by) REFERENCES users(user_id)
        )`);

        // Test Run Results Table
        db.run(`CREATE TABLE IF NOT EXISTS test_run_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_run_id INTEGER NOT NULL,
            test_case_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('Pass', 'Fail', 'Blocked', 'Not Run')) DEFAULT 'Not Run',
            actual_result TEXT,
            comments TEXT,
            FOREIGN KEY (test_run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE
        )`);

        // Defects Table
        db.run(`CREATE TABLE IF NOT EXISTS defects (
            defect_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            test_case_id INTEGER,
            test_run_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')),
            priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
            status TEXT CHECK(status IN ('Open', 'In Progress', 'Retest', 'Closed')) DEFAULT 'Open',
            assignee_id INTEGER,
            steps TEXT,
            expected_result TEXT,
            actual_result TEXT,
            detection_source TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE SET NULL,
            FOREIGN KEY (test_run_id) REFERENCES test_runs(test_run_id) ON DELETE SET NULL,
            FOREIGN KEY (assignee_id) REFERENCES users(user_id)
        )`);

        // Attachments Table
        db.run(`CREATE TABLE IF NOT EXISTS attachments (
            attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT CHECK(entity_type IN ('test_case', 'test_run_result', 'defect')),
            entity_id INTEGER,
            file_path TEXT NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Requirements Table
        db.run(`CREATE TABLE IF NOT EXISTS requirements (
            requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            version TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Requirement Test Case Mapping
        db.run(`CREATE TABLE IF NOT EXISTS requirement_test_cases (
            requirement_id INTEGER,
            test_case_id INTEGER,
            PRIMARY KEY (requirement_id, test_case_id),
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE,
            FOREIGN KEY (test_case_id) REFERENCES test_cases(test_case_id) ON DELETE CASCADE
        )`);

        // Static Issues Table
        db.run(`CREATE TABLE IF NOT EXISTS static_issues (
            issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file TEXT,
            line INTEGER,
            message TEXT,
            rule TEXT,
            severity TEXT,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Security Issues Table
        db.run(`CREATE TABLE IF NOT EXISTS security_issues (
            issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file TEXT,
            severity TEXT,
            rule TEXT,
            description TEXT,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Complexity Metrics Table
        db.run(`CREATE TABLE IF NOT EXISTS complexity_metrics (
            metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            file TEXT,
            complexity_score REAL,
            maintainability_index REAL,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Coverage Summary Table
        db.run(`CREATE TABLE IF NOT EXISTS coverage_summary (
            summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            lines_covered INTEGER,
            lines_total INTEGER,
            branches_covered INTEGER,
            branches_total INTEGER,
            functions_covered INTEGER,
            functions_total INTEGER,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Test Type Results Table
        db.run(`CREATE TABLE IF NOT EXISTS test_type_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            test_type TEXT,
            status TEXT CHECK(status IN ('PASS', 'FAIL', 'SKIP', 'ERROR')),
            passed INTEGER DEFAULT 0,
            failed INTEGER DEFAULT 0,
            duration_ms INTEGER,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES test_runs(test_run_id) ON DELETE CASCADE
        )`);

        // Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER PRIMARY KEY,
            coverage_threshold INTEGER DEFAULT 80,
            complexity_threshold INTEGER DEFAULT 10,
            security_strictness TEXT DEFAULT 'High',
            notifications_enabled INTEGER DEFAULT 1,
            rtm_strictness TEXT DEFAULT 'Strict',
            FOREIGN KEY(user_id) REFERENCES users(user_id)
        )`);

        // AI Test Case Generator Table
        db.run(`CREATE TABLE IF NOT EXISTS ai_test_cases (
            ai_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            source_type TEXT,
            source_content TEXT,
            generated_cases TEXT,
            confidence_score REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Bug Predictions Table
        db.run(`CREATE TABLE IF NOT EXISTS bug_predictions (
            prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            module_name TEXT,
            file_path TEXT,
            risk_score REAL,
            predicted_bugs INTEGER,
            factors TEXT,
            prediction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Visual Regression Tests Table
        db.run(`CREATE TABLE IF NOT EXISTS visual_tests (
            visual_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            test_name TEXT,
            baseline_screenshot TEXT,
            comparison_screenshot TEXT,
            diff_screenshot TEXT,
            diff_percentage REAL,
            status TEXT,
            browser TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // API Collections Table
        db.run(`CREATE TABLE IF NOT EXISTS api_collections (
            collection_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            name TEXT,
            description TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // API Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS api_requests (
            request_id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_id INTEGER,
            name TEXT,
            method TEXT,
            url TEXT,
            headers TEXT,
            body TEXT,
            expected_status INTEGER,
            expected_response TEXT,
            FOREIGN KEY (collection_id) REFERENCES api_collections(collection_id) ON DELETE CASCADE
        )`);

        // API Test Results Table
        db.run(`CREATE TABLE IF NOT EXISTS api_test_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER,
            status_code INTEGER,
            response_time INTEGER,
            response_body TEXT,
            passed INTEGER,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES api_requests(request_id) ON DELETE CASCADE
        )`);

        // Performance Tests Table
        db.run(`CREATE TABLE IF NOT EXISTS performance_tests (
            perf_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            test_name TEXT,
            target_url TEXT,
            virtual_users INTEGER,
            duration_seconds INTEGER,
            avg_response_time REAL,
            max_response_time REAL,
            min_response_time REAL,
            throughput REAL,
            error_rate REAL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Security Scans Table
        db.run(`CREATE TABLE IF NOT EXISTS security_scans (
            scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            scan_type TEXT,
            target TEXT,
            vulnerabilities_found INTEGER,
            critical_count INTEGER,
            high_count INTEGER,
            medium_count INTEGER,
            low_count INTEGER,
            scan_report TEXT,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Vulnerabilities Table
        db.run(`CREATE TABLE IF NOT EXISTS vulnerabilities (
            vuln_id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER,
            type TEXT,
            severity TEXT,
            description TEXT,
            location TEXT,
            remediation TEXT,
            FOREIGN KEY (scan_id) REFERENCES security_scans(scan_id) ON DELETE CASCADE
        )`);

        // Visual Regression Testing Tables

        // Performance Testing Tables (Project 6)
        db.run(`CREATE TABLE IF NOT EXISTS perf_configs (
            config_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            target_url TEXT NOT NULL,
            virtual_users INTEGER DEFAULT 10,
            duration_seconds INTEGER DEFAULT 30,
            ramp_up_seconds INTEGER DEFAULT 0,
            test_type TEXT DEFAULT 'load',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS perf_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER,
            test_name TEXT,
            target_url TEXT,
            avg_response_time REAL,
            max_response_time REAL,
            throughput REAL,
            error_rate REAL,
            raw_data TEXT, 
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (config_id) REFERENCES perf_configs(config_id) ON DELETE SET NULL
        )`);

        // Visual regression projects
        db.run(`CREATE TABLE IF NOT EXISTS visual_projects (
            visual_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            base_url TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        )`);

        // Test run configurations
        db.run(`CREATE TABLE IF NOT EXISTS visual_runs (
            run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            visual_project_id INTEGER,
            run_type TEXT CHECK(run_type IN ('baseline', 'comparison')),
            browser TEXT,
            viewport TEXT,
            status TEXT DEFAULT 'pending',
            total_screenshots INTEGER DEFAULT 0,
            total_diffs INTEGER DEFAULT 0,
            passed INTEGER DEFAULT 0,
            failed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (visual_project_id) REFERENCES visual_projects(visual_project_id) ON DELETE CASCADE
        )`);

        // Individual screenshots
        db.run(`CREATE TABLE IF NOT EXISTS visual_screenshots (
            screenshot_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            page_url TEXT NOT NULL,
            page_name TEXT,
            image_path TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES visual_runs(run_id) ON DELETE CASCADE
        )`);

        // Baseline images (reference)
        db.run(`CREATE TABLE IF NOT EXISTS baseline_images (
            baseline_id INTEGER PRIMARY KEY AUTOINCREMENT,
            visual_project_id INTEGER,
            page_url TEXT NOT NULL,
            page_name TEXT,
            browser TEXT,
            viewport TEXT,
            image_path TEXT NOT NULL,
            approved_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (visual_project_id) REFERENCES visual_projects(visual_project_id) ON DELETE CASCADE
        )`);

        // Visual differences detected
        db.run(`CREATE TABLE IF NOT EXISTS visual_diffs (
            diff_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            baseline_image_id INTEGER,
            current_image_id INTEGER,
            page_url TEXT,
            page_name TEXT,
            diff_image_path TEXT,
            mismatch_pixels INTEGER,
            mismatch_percentage REAL,
            status TEXT CHECK(status IN ('pass', 'warning', 'fail')),
            severity TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (run_id) REFERENCES visual_runs(run_id) ON DELETE CASCADE,
            FOREIGN KEY (baseline_image_id) REFERENCES baseline_images(baseline_id),
            FOREIGN KEY (current_image_id) REFERENCES visual_screenshots(screenshot_id)
        )`);

        // ============================================
        // SELENIUM CLOUD TABLES (PROJECT 8)
        // ============================================

        // 1. Selenium Scripts (Uploaded)
        db.run(`CREATE TABLE IF NOT EXISTS selenium_scripts (
            script_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            file_path TEXT NOT NULL,
            uploaded_by INTEGER,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
        )`);

        // 2. Selenium Job Runs (The overall request)
        db.run(`CREATE TABLE IF NOT EXISTS selenium_job_runs (
            job_id INTEGER PRIMARY KEY AUTOINCREMENT,
            script_id INTEGER,
            user_id INTEGER,
            status TEXT DEFAULT 'Pending', -- Pending, Running, Completed, Failed
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (script_id) REFERENCES selenium_scripts(script_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )`);

        // 3. Browser Executions (Per browser in a job)
        db.run(`CREATE TABLE IF NOT EXISTS selenium_browser_executions (
            execution_id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            browser TEXT NOT NULL, -- chrome, firefox, edge
            status TEXT DEFAULT 'Pending', -- Pending, Running, Passed, Failed
            session_id TEXT, -- Selenium Session ID
            video_path TEXT,
            logs_path TEXT,
            error_message TEXT,
            start_time DATETIME,
            end_time DATETIME,
            FOREIGN KEY (job_id) REFERENCES selenium_job_runs(job_id) ON DELETE CASCADE
        )`);

        // Web Monitor & Link Checker Tables (Project 9)
        db.run(`CREATE TABLE IF NOT EXISTS monitoring_jobs (
            job_id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            status TEXT DEFAULT 'Running', -- Running, Completed, Failed
            health_score INTEGER,
            total_links INTEGER,
            broken_links INTEGER,
            scan_duration INTEGER, -- ms
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS link_validation_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER,
            url TEXT,
            status_code INTEGER,
            status TEXT, -- Valid, Broken, Redirect, Warning
            response_time INTEGER, -- ms
            error_message TEXT,
            FOREIGN KEY(job_id) REFERENCES monitoring_jobs(job_id) ON DELETE CASCADE
        )`);

        // ============================================
        // API TESTING PLATFORM TABLES
        // ============================================

        // API Collections
        db.run(`CREATE TABLE IF NOT EXISTS api_collections (
            collection_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            name TEXT NOT NULL,
            description TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(user_id)
        )`);

        // API Requests
        db.run(`CREATE TABLE IF NOT EXISTS api_requests (
            request_id INTEGER PRIMARY KEY AUTOINCREMENT,
            collection_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            method TEXT NOT NULL CHECK(method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS')),
            url TEXT NOT NULL,
            headers TEXT,
            body TEXT,
            params TEXT,
            auth_type TEXT CHECK(auth_type IN ('none', 'bearer', 'apikey', 'basic')),
            auth_value TEXT,
            expected_status INTEGER,
            schema TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (collection_id) REFERENCES api_collections(collection_id) ON DELETE CASCADE
        )`);

        // API Test Results
        db.run(`CREATE TABLE IF NOT EXISTS api_test_results (
            result_id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            status_code INTEGER,
            response_time_ms INTEGER,
            response_body TEXT,
            response_headers TEXT,
            success BOOLEAN,
            schema_valid BOOLEAN,
            error_message TEXT,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (request_id) REFERENCES api_requests(request_id) ON DELETE CASCADE
        )`);

        // ============================================
        // MOBILE APP TESTING TABLES (PROJECT 10)
        // ============================================


        // SECURITY TESTING TABLES (PROJECT 7)
        // ============================================

        db.run(`DROP TABLE IF EXISTS security_scans`);
        db.run(`DROP TABLE IF EXISTS security_findings`);

        db.run(`CREATE TABLE IF NOT EXISTS security_scans (
            scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            target TEXT NOT NULL,          -- URL for DAST, Filename for SAST
            scan_type TEXT NOT NULL,       -- 'SAST' or 'DAST'
            status TEXT DEFAULT 'Pending', -- Pending, Running, Completed, Failed
            risk_score INTEGER DEFAULT 0,  -- 0-100
            critical_count INTEGER DEFAULT 0,
            high_count INTEGER DEFAULT 0,
            medium_count INTEGER DEFAULT 0,
            low_count INTEGER DEFAULT 0,
            scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS security_findings (
            finding_id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER,
            vulnerability_type TEXT,       -- e.g., 'SQL Injection', 'Hardcoded Secret'
            severity TEXT,                 -- Critical, High, Medium, Low
            description TEXT,
            location TEXT,                 -- Line number or URL parameter
            remediation TEXT,
            FOREIGN KEY (scan_id) REFERENCES security_scans(scan_id) ON DELETE CASCADE
        )`);

        console.log('Database tables initialized.');
    });
}

module.exports = db;
