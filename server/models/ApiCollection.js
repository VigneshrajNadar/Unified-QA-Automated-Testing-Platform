const mongoose = require('mongoose');

const apiResultSchema = new mongoose.Schema({
    status_code: { type: Number },
    response_time: { type: Number },
    response_body: { type: String },
    passed: { type: Boolean },
    executed_at: { type: Date, default: Date.now }
});

const apiRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    method: { type: String, default: 'GET' },
    url: { type: String, required: true },
    headers: { type: String }, // Stored as JSON string
    body: { type: String },
    expected_status: { type: Number, default: 200 },
    expected_body_snippet: { type: String },
    results: [apiResultSchema],
    created_at: { type: Date, default: Date.now }
});

const apiCollectionSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    description: { type: String },
    base_url: { type: String },
    requests: [apiRequestSchema],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ApiCollection', apiCollectionSchema);
