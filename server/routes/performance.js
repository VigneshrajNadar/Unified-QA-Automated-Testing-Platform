const express = require('express');
const router = express.Router();
const db = require('../database');
const { runK6Test, checkK6Availability } = require('../services/k6Runner');
const parseResults = require('../services/resultParser');

/**
 * Check if k6 is installed
 */
router.get('/status', async (req, res) => {
    const isAvailable = await checkK6Availability();
    res.json({ k6_installed: isAvailable });
});

/**
 * Trigger Load Test
 * POST /api/performance/run
 * Body: { url, users, duration, save_config (bool), name (optional) }
 */
router.post('/run', async (req, res) => {
    console.log('[API] /run body:', req.body);
    const { url, users, duration, save_config, name, testType } = req.body;

    if (!url) return res.status(400).json({ error: 'Target URL is required' });

    try {
        // 1. Run Test
        const outputFile = await runK6Test({ url, users, duration, testType });

        // 2. Parse Results
        const results = parseResults(outputFile);

        // 3. Save to Database (History)
        // 3. Save to Database (History)
        const sql = `INSERT INTO perf_results (test_name, target_url, avg_response_time, max_response_time, throughput, error_rate, raw_data, test_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        // Format test type for display name (e.g., 'stress' -> 'Stress Test')
        const typeLabel = (testType || 'load').charAt(0).toUpperCase() + (testType || 'load').slice(1);
        const testName = name || `${typeLabel} Test - ${new Date().toLocaleString()}`;

        const rawData = JSON.stringify(results);

        db.run(sql, [testName, url, results.avg, results.max, results.throughput, results.errorRate, rawData, testType || 'load'], function (err) {
            if (err) {
                console.error("Error saving result:", err);
                // Return result anyway, but log error
            }
            res.json({
                message: 'Test completed successfully',
                result_id: this ? this.lastID : null,
                metrics: results
            });
        });

        // 4. Save Config (Optional)
        if (save_config) {
            const configSql = `INSERT INTO perf_configs (name, target_url, virtual_users, duration_seconds) VALUES (?, ?, ?, ?)`;
            db.run(configSql, [testName, url, users, duration], (err) => {
                if (err) console.error("Error saving config:", err);
            });
        }

    } catch (error) {
        console.error("Load Test Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Test History
 * GET /api/performance/history
 */
router.get('/history', (req, res) => {
    const sql = `SELECT * FROM perf_results ORDER BY executed_at DESC LIMIT 50`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/**
 * Get Saved Presets
 * GET /api/performance/configs
 */
router.get('/configs', (req, res) => {
    const sql = `SELECT * FROM perf_configs ORDER BY created_at DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
