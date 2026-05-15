const cron = require('node-cron');
const db = require('../database');
const { executeMultipleRequests, executeApiRequest } = require('./apiExecutor');

// Store active cron tasks
const activeTasks = {};

/**
 * Initialize Scheduler
 * Loads active monitors from DB and schedules them
 */
function initScheduler() {
    console.log('⏰ Initializing API Monitor Scheduler...');

    // Clear existing tasks if any (for hot reload)
    Object.keys(activeTasks).forEach(id => {
        if (activeTasks[id]) activeTasks[id].stop();
    });

    const sql = `SELECT * FROM api_monitors WHERE is_active = 1`;

    db.all(sql, [], (err, monitors) => {
        if (err) {
            console.error('Error loading monitors:', err.message);
            return;
        }

        console.log(`Found ${monitors.length} active monitors.`);
        monitors.forEach(monitor => scheduleMonitor(monitor));
    });
}

/**
 * Schedule a specific monitor
 * @param {Object} monitor - Monitor object from DB 
 */
function scheduleMonitor(monitor) {
    if (!cron.validate(monitor.frequency_cron)) {
        console.error(`Invalid cron '${monitor.frequency_cron}' for monitor ${monitor.monitor_id}`);
        return;
    }

    // Stop existing if re-scheduling
    if (activeTasks[monitor.monitor_id]) {
        activeTasks[monitor.monitor_id].stop();
    }

    console.log(`Scheduling Monitor #${monitor.monitor_id} ("${monitor.name}"): ${monitor.frequency_cron}`);

    const task = cron.schedule(monitor.frequency_cron, async () => {
        console.log(`🚀 Running Monitor #${monitor.monitor_id}: ${monitor.name}`);

        try {
            // Update last run time
            db.run(`UPDATE api_monitors SET last_run = CURRENT_TIMESTAMP WHERE monitor_id = ?`, [monitor.monitor_id]);

            // Get Requests
            const requestsSql = `SELECT * FROM api_requests WHERE collection_id = ? ORDER BY request_id ASC`;

            db.all(requestsSql, [monitor.collection_id], async (err, requests) => {
                if (err || !requests || requests.length === 0) {
                    console.error(`Monitor #${monitor.monitor_id} failed: No requests or DB error.`);
                    return;
                }

                // Execute Requests
                // We use executeMultipleRequests but we assume it doesn't save to DB directly?
                // Wait, executeMultipleRequests doesn't save results, apiTesting.js does.
                // Actually, apiTesting.js calls executeMultipleRequests then saves.
                // So we need to save results manually here.

                const results = await executeMultipleRequests(requests);

                // Save Results with monitor_id
                const saveSql = `
                    INSERT INTO api_test_results 
                    (request_id, status_code, response_time_ms, response_body, response_headers, success, schema_valid, error_message, monitor_id, executed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `;

                let successCount = 0;

                results.forEach(result => {
                    if (result.success) successCount++;

                    db.run(saveSql, [
                        result.request_id,
                        result.status_code,
                        result.response_time_ms,
                        result.response_body,
                        result.response_headers,
                        result.success,
                        null, // schema_valid (skipping for monitors for now)
                        result.error_message,
                        monitor.monitor_id
                    ], (err) => {
                        if (err) console.error(`Failed to save result for monitor #${monitor.monitor_id}:`, err.message);
                    });
                });

                console.log(`✅ Monitor #${monitor.monitor_id} Finished. ${successCount}/${results.length} Passed.`);
            });

        } catch (error) {
            console.error(`Monitor #${monitor.monitor_id} crashed:`, error);
        }
    });

    activeTasks[monitor.monitor_id] = task;
}

/**
 * Remove/Stop a monitor
 */
function stopMonitor(monitorId) {
    if (activeTasks[monitorId]) {
        activeTasks[monitorId].stop();
        delete activeTasks[monitorId];
        console.log(`Stopped Monitor #${monitorId}`);
    }
}

module.exports = {
    initScheduler,
    scheduleMonitor,
    stopMonitor
};
