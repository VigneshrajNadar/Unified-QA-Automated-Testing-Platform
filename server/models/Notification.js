const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g. /defects, /test-cases
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['assignment', 'mention', 'system'], default: 'system' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
