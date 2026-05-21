const mongoose = require('mongoose');

const apiMonitorSchema = new mongoose.Schema({
    collection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiCollection', required: true },
    name: { type: String, required: true },
    frequency_cron: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ApiMonitor', apiMonitorSchema);
