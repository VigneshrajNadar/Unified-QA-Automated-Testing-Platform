const mongoose = require('mongoose');

const testSuiteSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String, default: null },
  test_cases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('TestSuite', testSuiteSchema);
