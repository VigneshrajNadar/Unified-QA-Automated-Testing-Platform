const db = require('../database');
const webMonitorService = require('../services/webMonitorService');

exports.startScan = (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Create Job
    db.run(`INSERT INTO monitoring_jobs (url) VALUES (?)`, [url], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const jobId = this.lastID;
        // Start Async Scan
        webMonitorService.runScan(jobId, url);

        res.json({ job_id: jobId, message: 'Scan started' });
    });
};

exports.getScans = (req, res) => {
    db.all(`SELECT * FROM monitoring_jobs ORDER BY created_at DESC LIMIT 20`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.getScanDetails = (req, res) => {
    const { id } = req.params;

    db.get(`SELECT * FROM monitoring_jobs WHERE job_id = ?`, [id], (err, job) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        db.all(`SELECT * FROM link_validation_results WHERE job_id = ?`, [id], (err, links) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ...job, links });
        });
    });
};

exports.deleteJob = (req, res) => {
    const { id } = req.params;
    console.log(`[DEBUG] Attempting to delete Monitor scan: ${id}`);
    db.run(`DELETE FROM monitoring_jobs WHERE job_id = ?`, [id], function (err) {
        if (err) {
            console.error('[DEBUG] Delete Error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[DEBUG] Deleted Monitor scan ${id}. Changes: ${this.changes}`);
        res.json({ message: 'Scan deleted successfully' });
    });
};

