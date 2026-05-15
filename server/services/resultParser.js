const fs = require("fs");

function parseResults(file) {
    if (!fs.existsSync(file)) {
        throw new Error("Output file not found");
    }

    const content = fs.readFileSync(file, "utf-8");
    if (!content) return { avg: 0, max: 0, throughput: 0, errorRate: 0 };

    const lines = content.split("\n");
    let responseTimes = [];
    let timingMetrics = { blocked: [], connecting: [], waiting: [], receiving: [] };
    let errors = 0;

    console.log(`[Parser] Parsing ${lines.length} lines from k6 output...`);
    let totalRequests = 0;
    let startTime = null;
    let endTime = null;

    let dataReceived = 0;
    let dataSent = 0;
    let statusCodes = {};

    lines.forEach(line => {
        if (!line.trim()) return;
        try {
            const json = JSON.parse(line);

            // Track start/end for throughput
            if (json.time) {
                const t = new Date(json.time).getTime();
                if (!startTime || t < startTime) startTime = t;
                if (!endTime || t > endTime) endTime = t;
            }

            if (json.type === 'Point') {
                if (json.metric === 'http_req_duration') {
                    responseTimes.push(json.data.value);
                    // Extract Status Code
                    if (json.data.tags && json.data.tags.status) {
                        const code = json.data.tags.status;
                        if (!statusCodes[code]) statusCodes[code] = 0;
                        statusCodes[code]++;
                    }
                }
                if (json.metric === 'http_req_waiting') timingMetrics.waiting.push(json.data.value); // Time to First Byte (TTFB)
                if (json.metric === 'http_req_connecting') timingMetrics.connecting.push(json.data.value);
                if (json.metric === 'http_req_receiving') timingMetrics.receiving.push(json.data.value);
                if (json.metric === 'http_req_blocked') timingMetrics.blocked.push(json.data.value);

                if (json.metric === 'data_received') dataReceived += json.data.value;
                if (json.metric === 'data_sent') dataSent += json.data.value;

                if (json.metric === 'http_req_failed') {
                    totalRequests++;
                    if (json.data.value === 1) errors++;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    });

    const defaultTimings = { blocked: 0, connecting: 0, waiting: 0, receiving: 0 };
    if (responseTimes.length === 0) {
        return {
            avg: 0, max: 0, median: 0, p95: 0, p99: 0,
            throughput: 0, errorRate: 0,
            totalRequests: 0, dataReceived: 0,
            timings: defaultTimings
        };
    }

    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const max = Math.max(...responseTimes);

    // Convert logic to helper for percentiles
    const getPercentile = (arr, p) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    };

    const median = getPercentile(responseTimes, 50);
    const p95 = getPercentile(responseTimes, 95);
    const p99 = getPercentile(responseTimes, 99);

    // Throughput
    const durationSec = (endTime - startTime) / 1000;
    const throughput = durationSec > 0 ? (responseTimes.length / durationSec) : 0;

    // Error Rate
    const errorRate = totalRequests > 0 ? ((errors / totalRequests) * 100) : 0;

    // Avg Timings
    const getAvg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const timings = {
        blocked: parseFloat(getAvg(timingMetrics.blocked).toFixed(2)),
        connecting: parseFloat(getAvg(timingMetrics.connecting).toFixed(2)),
        waiting: parseFloat(getAvg(timingMetrics.waiting).toFixed(2)), // TTFB
        receiving: parseFloat(getAvg(timingMetrics.receiving).toFixed(2)) // Download
    };

    return {
        avg: parseFloat(avg.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        p95: parseFloat(p95.toFixed(2)),
        p99: parseFloat(p99.toFixed(2)),
        throughput: parseFloat(throughput.toFixed(2)),
        errorRate: parseFloat(errorRate.toFixed(2)),
        totalRequests,
        dataReceived: parseFloat((dataReceived / 1024 / 1024).toFixed(2)), // MB
        dataSent: parseFloat((dataSent / 1024 / 1024).toFixed(2)), // MB
        statusCodes,
        timings
    };
}

module.exports = parseResults;
