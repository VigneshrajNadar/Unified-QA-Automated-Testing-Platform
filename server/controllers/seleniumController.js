const seleniumService = require('../services/seleniumService');
const db = require('../database');
const path = require('path');

exports.getDashboardData = (req, res) => {
    const stats = {};
    db.serialize(() => {
        db.get(`SELECT count(*) as total_jobs FROM selenium_job_runs`, (err, row) => stats.total_jobs = row.total_jobs);
        db.all(`SELECT j.*, s.name as script_name FROM selenium_job_runs j LEFT JOIN selenium_scripts s ON j.script_id = s.script_id ORDER BY j.created_at DESC LIMIT 5`, (err, rows) => stats.recent_jobs = rows);
        db.all(`SELECT * FROM selenium_browser_executions ORDER BY start_time DESC LIMIT 10`, (err, rows) => {
            stats.recent_executions = rows;
            res.json(stats);
        });
    });
};

exports.uploadScript = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No script file uploaded' });
    }

    const { name, description, user_id } = req.body;
    const filePath = req.file.path;

    db.run(`INSERT INTO selenium_scripts (name, description, file_path, uploaded_by) VALUES (?, ?, ?, ?)`,
        [name, description, filePath, user_id || 1],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ script_id: this.lastID, message: 'Script uploaded successfully' });
        }
    );
};

exports.runTest = (req, res) => {
    const { script_id, browsers, target_url, user_id } = req.body; // browsers = ['chrome', 'firefox']

    if (!script_id || !browsers || browsers.length === 0) {
        return res.status(400).json({ error: 'Missing script_id or browsers' });
    }

    // Get script path
    db.get(`SELECT file_path FROM selenium_scripts WHERE script_id = ?`, [script_id], (err, row) => {
        if (!row) return res.status(404).json({ error: 'Script not found' });

        // Create Job
        db.run(`INSERT INTO selenium_job_runs (script_id, user_id, status) VALUES (?, ?, 'Pending')`,
            [script_id, user_id || 1],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                const jobId = this.lastID;
                seleniumService.executeTest(jobId, row.file_path, browsers, target_url);

                res.json({ job_id: jobId, message: 'Test execution started' });
            }
        );
    });
};

exports.getJobDetails = (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM selenium_job_runs WHERE job_id = ?`, [id], (err, job) => {
        if (!job) return res.status(404).json({ error: 'Job not found' });

        db.all(`SELECT * FROM selenium_browser_executions WHERE job_id = ?`, [id], (err, executions) => {
            res.json({ ...job, executions });
        });
    });
};

exports.getScripts = (req, res) => {
    db.all(`SELECT * FROM selenium_scripts ORDER BY uploaded_at DESC`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.deleteJob = (req, res) => {
    const { id } = req.params;
    console.log(`[DEBUG] Attempting to delete Selenium job: ${id}`);
    db.run(`DELETE FROM selenium_job_runs WHERE job_id = ?`, [id], function (err) {
        if (err) {
            console.error('[DEBUG] Delete Error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[DEBUG] Deleted Selenium job ${id}. Changes: ${this.changes}`);
        res.json({ message: 'Job deleted successfully' });
    });
};

