const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
    vulnerability_type: { type: String, required: true },
    severity: { type: String, required: true }, // Critical, High, Medium, Low, Info
    description: { type: String },
    location: { type: String },
    remediation: { type: String }
});

const securityScanSchema = new mongoose.Schema({
    target: { type: String, required: true }, // URL or Filename
    scan_type: { type: String, enum: ['SAST', 'DAST'], required: true },
    status: { type: String, enum: ['Running', 'Completed', 'Failed'], default: 'Running' },
    risk_score: { type: Number, default: 0 },
    critical_count: { type: Number, default: 0 },
    high_count: { type: Number, default: 0 },
    medium_count: { type: Number, default: 0 },
    low_count: { type: Number, default: 0 },
    findings: [findingSchema],
    scanned_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SecurityScan', securityScanSchema);
