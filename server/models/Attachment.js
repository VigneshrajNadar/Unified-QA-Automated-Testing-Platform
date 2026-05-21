const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    entity_type: { type: String, required: true }, // e.g., 'defect', 'test_case', etc.
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    file_path: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attachment', attachmentSchema);
