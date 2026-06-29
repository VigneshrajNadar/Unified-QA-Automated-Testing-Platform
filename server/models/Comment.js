const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  entity_type: { type: String, enum: ['Defect', 'TestCase', 'TestRun'], required: true },
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Comment', commentSchema);
