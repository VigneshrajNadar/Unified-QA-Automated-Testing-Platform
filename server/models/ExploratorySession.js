const mongoose = require('mongoose');

const exploratorySessionSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    tester_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    charter: { type: String, required: true }, // The goal of the session
    start_time: { type: Date, required: true },
    end_time: { type: Date },
    duration_minutes: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Completed', 'Paused'], default: 'Active' },
    notes: [{
        timestamp: { type: Date, default: Date.now },
        content: String,
        type: { type: String, enum: ['Bug', 'Idea', 'Note', 'Question'], default: 'Note' }
    }],
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExploratorySession', exploratorySessionSchema);
