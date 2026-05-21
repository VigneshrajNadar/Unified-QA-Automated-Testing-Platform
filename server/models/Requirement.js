const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
    version_number: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    change_reason: { type: String },
    changed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changed_at: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment_text: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const requirementSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    req_identifier: { type: String, required: true }, // e.g., REQ-001
    title: { type: String, required: true },
    description: { type: String, default: null },
    type: { type: String, default: 'Functional' },
    status: { type: String, default: 'Draft' },
    priority: { type: String, default: 'Medium' },
    category: { type: String, default: 'Story' },
    urgency: { type: String, default: 'Medium' },
    business_value: { type: Number, default: 0 },
    version: { type: String, default: '1.0' },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement', default: null },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    test_cases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' }],
    history: [versionSchema],
    comments: [commentSchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Requirement', requirementSchema);
