const cron = require('node-cron');
const ApiMonitor = require('../models/ApiMonitor');
const ApiCollection = require('../models/ApiCollection');
const { executeMultipleRequests } = require('./apiExecutor');

// Store active cron tasks
const activeTasks = {};

/**
 * Initialize Scheduler
 * Loads active monitors from DB and schedules them
 */
async function initScheduler() {
    console.log('⏰ Initializing API Monitor Scheduler...');

    // Clear existing tasks if any (for hot reload)
    Object.keys(activeTasks).forEach(id => {
        if (activeTasks[id]) activeTasks[id].stop();
    });

    try {
        const monitors = await ApiMonitor.find({ is_active: true }).lean();
        console.log(`Found ${monitors.length} active monitors.`);
        
        monitors.forEach(monitor => {
            // Mapping for compatibility
            const monitorObj = {
                ...monitor,
                monitor_id: monitor._id.toString()
            };
            scheduleMonitor(monitorObj);
        });
    } catch (err) {
        console.error('Error loading monitors:', err.message);
    }
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
            await ApiMonitor.findByIdAndUpdate(monitor.monitor_id, { updated_at: Date.now() });

            const collection = await ApiCollection.findById(monitor.collection_id);
            if (!collection || !collection.requests || collection.requests.length === 0) {
                console.error(`Monitor #${monitor.monitor_id} failed: No requests found.`);
                return;
            }

            const reqsObj = collection.requests.map(r => ({ ...r.toObject(), request_id: r._id }));
            const results = await executeMultipleRequests(reqsObj);

            let successCount = 0;

            for (const result of results) {
                if (result.success) successCount++;

                const request = collection.requests.id(result.request_id);
                if (request) {
                    request.results.push({
                        status_code: result.status_code,
                        response_time: result.response_time_ms,
                        response_body: result.response_body,
                        passed: result.success
                    });
                }
            }

            await collection.save();

            console.log(`✅ Monitor #${monitor.monitor_id} Finished. ${successCount}/${results.length} Passed.`);
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
