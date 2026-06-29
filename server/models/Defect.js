const mongoose = require('mongoose');

const defectSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  issue_type: { type: String, enum: ['Bug', 'Task', 'Story'], default: 'Bug' },
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
  sprint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // alias for compatibility
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // alias for compatibility
  branch_name: { type: String, default: null }, // Developer integration
  pr_link: { type: String, default: null },     // Developer integration
  ci_status: { type: String, enum: ['Pending', 'Pass', 'Fail', null], default: null }, // Developer integration
  custom_fields: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }, // Custom Field Engine
  activity_log: [{
      action: String,
      timestamp: { type: Date, default: Date.now },
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      user_name: String
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Defect', defectSchema);
