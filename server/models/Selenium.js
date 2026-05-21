const mongoose = require('mongoose');

const seleniumScriptSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    file_path: { type: String, required: true },
    uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploaded_at: { type: Date, default: Date.now }
});

const executionSchema = new mongoose.Schema({
    browser: { type: String },
    status: { type: String, default: 'Pending' },
    start_time: { type: Date },
    end_time: { type: Date },
    log_output: { type: String },
    screenshot_path: { type: String },
    video_path: { type: String }
});

const seleniumJobSchema = new mongoose.Schema({
    script_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SeleniumScript', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'Pending' },
    executions: [executionSchema],
    created_at: { type: Date, default: Date.now }
});

module.exports = {
    SeleniumScript: mongoose.model('SeleniumScript', seleniumScriptSchema),
    SeleniumJob: mongoose.model('SeleniumJob', seleniumJobSchema)
};
