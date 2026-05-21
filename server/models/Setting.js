const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    coverage_threshold: { type: Number, default: 80 },
    complexity_threshold: { type: Number, default: 10 },
    security_strictness: { type: String, default: 'High' },
    notifications_enabled: { type: Boolean, default: true },
    rtm_strictness: { type: String, default: 'Strict' },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', settingSchema);
