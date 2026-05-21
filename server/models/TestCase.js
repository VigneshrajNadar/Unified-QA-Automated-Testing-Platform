const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, required: true },
  description: { type: String, default: null },
  steps: { type: String, default: null },
  expected_result: { type: String, default: null },
  priority: { type: String, default: 'Medium' },
  status: { type: String, default: 'Draft' },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCaseType' },
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TestCase', testCaseSchema);
