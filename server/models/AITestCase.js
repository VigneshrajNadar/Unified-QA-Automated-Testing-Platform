const mongoose = require('mongoose');

const aiTestCaseSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    source_type: { type: String, enum: ['requirement', 'user_story', 'code'], required: true },
    source_content: { type: String, required: true },
    generated_cases: { type: String, required: true }, // Stored as JSON string
    confidence_score: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AITestCase', aiTestCaseSchema);
