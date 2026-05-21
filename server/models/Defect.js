const mongoose = require('mongoose');

const defectSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  status: { type: String, default: 'New' },
  severity: { type: String, default: 'Medium' },
  priority: { type: String, default: 'Medium' },
  steps: { type: String, default: null },
  expected_result: { type: String, default: null },
  actual_result: { type: String, default: null },
  detection_source: { type: String, default: null },
  test_run_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestRun', default: null },
  test_case_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase', default: null },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // alias for compatibility
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // alias for compatibility
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Defect', defectSchema);
