const mongoose = require('mongoose');

const baselineSchema = new mongoose.Schema({
    page_url: { type: String, required: true },
    page_name: { type: String, required: true },
    browser: { type: String, required: true },
    viewport: { type: String, required: true },
    image_path: { type: String, required: true },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now }
});

const visualProjectSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    base_url: { type: String, required: true },
    baselines: [baselineSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('VisualProject', visualProjectSchema);
