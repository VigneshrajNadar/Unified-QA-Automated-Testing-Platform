const mongoose = require('mongoose');

const diffSchema = new mongoose.Schema({
    page_url: { type: String },
    page_name: { type: String },
    baseline_image_id: { type: mongoose.Schema.Types.ObjectId }, // From VisualProject baselines
    current_image_path: { type: String },
    diff_image_path: { type: String },
    mismatch_pixels: { type: Number },
    mismatch_percentage: { type: Number },
    status: { type: String }, // pass/fail
    severity: { type: String }
});

const visualRunSchema = new mongoose.Schema({
    visual_project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VisualProject', required: true },
    run_type: { type: String, enum: ['baseline', 'comparison'], required: true },
    browser: { type: String },
    viewport: { type: String },
    status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
    total_screenshots: { type: Number, default: 0 },
    total_diffs: { type: Number, default: 0 },
    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    diffs: [diffSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('VisualRun', visualRunSchema);
