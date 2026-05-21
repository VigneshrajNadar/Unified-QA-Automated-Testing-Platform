const express = require('express');
const router = express.Router();
const { PerformanceResult, PerformanceConfig } = require('../models/Performance');
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
        const typeLabel = (testType || 'load').charAt(0).toUpperCase() + (testType || 'load').slice(1);
        const testName = name || `${typeLabel} Test - ${new Date().toLocaleString()}`;
        const rawData = JSON.stringify(results);

        const newResult = new PerformanceResult({
            test_name: testName,
            target_url: url,
            avg_response_time: results.avg,
            max_response_time: results.max,
            throughput: results.throughput,
            error_rate: results.errorRate,
            raw_data: rawData,
            test_type: testType || 'load'
        });

        await newResult.save();

        // 4. Save Config (Optional)
        if (save_config) {
            const newConfig = new PerformanceConfig({
                name: testName,
                target_url: url,
                virtual_users: users,
                duration_seconds: duration
            });
            await newConfig.save();
        }

        res.json({
            message: 'Test completed successfully',
            result_id: newResult._id,
            metrics: results
        });

    } catch (error) {
        console.error("Load Test Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Test History
 * GET /api/performance/history
 */
router.get('/history', async (req, res) => {
    try {
        const history = await PerformanceResult.find().sort({ executed_at: -1 }).limit(50).lean();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Saved Presets
 * GET /api/performance/configs
 */
router.get('/configs', async (req, res) => {
    try {
        const configs = await PerformanceConfig.find().sort({ created_at: -1 }).lean();
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
