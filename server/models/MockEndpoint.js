const mongoose = require('mongoose');

const mockEndpointSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  name: { type: String, required: true },
  method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
  endpoint: { type: String, required: true }, // e.g., '/users' or '/auth/login'
  status_code: { type: Number, default: 200 },
  response_body: { type: String, default: '{}' }, // JSON string
  headers: { type: String, default: '{"Content-Type":"application/json"}' }, // JSON string
  delay_ms: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MockEndpoint', mockEndpointSchema);
