const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, required: true },
  description: { type: String, default: null },
  steps: [{
    step_number: Number,
    action: String,
    expected_result: String
  }],
  expected_result: { type: String, default: null },
  preconditions: { type: String, default: null },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, default: 'Open' },
  test_type: { type: String, enum: ['Manual', 'Automated', 'Performance', 'Security', 'API'], default: 'Manual' },
  type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCaseType' },
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sprint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TestCase', testCaseSchema);
