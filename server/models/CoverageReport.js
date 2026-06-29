const mongoose = require('mongoose');

const coverageReportSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  build_number: { type: String, required: true },
  branch: { type: String, default: 'main' },
  metrics: {
      statements: { type: Number, default: 0 },
      statements_covered: { type: Number, default: 0 },
      branches: { type: Number, default: 0 },
      branches_covered: { type: Number, default: 0 },
      functions: { type: Number, default: 0 },
      functions_covered: { type: Number, default: 0 },
      lines: { type: Number, default: 0 },
      lines_covered: { type: Number, default: 0 }
  },
  percentage: { type: Number, default: 0 }, // Overall percentage
  uploaded_at: { type: Date, default: Date.now },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('CoverageReport', coverageReportSchema);
