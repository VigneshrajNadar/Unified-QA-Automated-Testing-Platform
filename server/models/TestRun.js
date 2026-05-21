const mongoose = require('mongoose');

const testRunSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed', 'Aborted'], default: 'Pending' },
  test_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestType' },
  environment: { type: String, default: 'Production' },
  browser: { type: String, default: null },
  started_at: { type: Date, default: null },
  completed_at: { type: Date, default: null },
  results: [{
    test_case_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' },
    status: { type: String, enum: ['Passed', 'Failed', 'Blocked', 'Not Run', 'Skipped'], default: 'Not Run' },
    actual_result: { type: String, default: null },
    comments: { type: String, default: null }
  }],
  metrics: { type: mongoose.Schema.Types.Mixed }, // For autotest metrics
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TestRun', testRunSchema);
