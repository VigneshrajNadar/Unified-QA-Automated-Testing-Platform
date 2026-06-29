const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  events: [{ type: String }], // 'run_started', 'run_completed', 'defect_created', etc.
  is_active: { type: Boolean, default: true },
  secret: { type: String }, // For signing payloads
  created_at: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Webhook', webhookSchema);
