const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    link_url: { type: String },
    status_code: { type: Number },
    status: { type: String } // 'Passed' or 'Failed'
});

const webMonitorJobSchema = new mongoose.Schema({
    url: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    total_links: { type: Number, default: 0 },
    broken_links: { type: Number, default: 0 },
    health_score: { type: Number, default: 0 },  // primary field used by frontend
    seo_score: { type: Number, default: 0 },      // legacy alias
    accessibility_score: { type: Number, default: 0 },
    performance_score: { type: Number, default: 0 },
    links: [linkSchema],
    created_at: { type: Date, default: Date.now },
    completed_at: { type: Date }
});

module.exports = mongoose.model('WebMonitorJob', webMonitorJobSchema);
