const mongoose = require('mongoose');

const performanceResultSchema = new mongoose.Schema({
    test_name: { type: String, required: true },
    target_url: { type: String, required: true },
    avg_response_time: { type: Number },
    max_response_time: { type: Number },
    throughput: { type: Number },
    error_rate: { type: Number },
    raw_data: { type: String }, // Stored as JSON string
    test_type: { type: String, default: 'load' },
    executed_at: { type: Date, default: Date.now }
});

const performanceConfigSchema = new mongoose.Schema({
    name: { type: String, required: true },
    target_url: { type: String, required: true },
    virtual_users: { type: Number, required: true },
    duration_seconds: { type: Number, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = {
    PerformanceResult: mongoose.model('PerformanceResult', performanceResultSchema),
    PerformanceConfig: mongoose.model('PerformanceConfig', performanceConfigSchema)
};
