const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true }, // e.g., 'Staging', 'Production'
  variables: [{
    key: { type: String, required: true }, // e.g., 'base_url'
    value: { type: String, required: true }, // e.g., 'https://api.staging.com'
    is_secret: { type: Boolean, default: false }
  }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Environment', environmentSchema);
