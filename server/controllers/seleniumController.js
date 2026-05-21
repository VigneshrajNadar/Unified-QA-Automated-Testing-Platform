const seleniumService = require('../services/seleniumService');
const { SeleniumScript, SeleniumJob } = require('../models/Selenium');
const path = require('path');

exports.getDashboardData = async (req, res) => {
    try {
        const stats = {};
        stats.total_jobs = await SeleniumJob.countDocuments();

        const recentJobs = await SeleniumJob.find()
            .populate('script_id', 'name')
            .sort({ created_at: -1 })
            .limit(5)
            .lean();
            
        stats.recent_jobs = recentJobs.map(job => ({
            ...job,
            job_id: job._id,
            script_name: job.script_id ? job.script_id.name : null
        }));

        // Flatten executions for recent executions list
        const jobsWithExecutions = await SeleniumJob.find()
            .sort({ "executions.start_time": -1 })
            .limit(10)
            .lean();

        let recent_executions = [];
        jobsWithExecutions.forEach(job => {
            if (job.executions) {
                job.executions.forEach(exe => {
                    recent_executions.push({
                        ...exe,
                        execution_id: exe._id,
                        job_id: job._id
                    });
                });
            }
        });

        // Sort manually after flattening and take top 10
        recent_executions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
        stats.recent_executions = recent_executions.slice(0, 10);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uploadScript = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No script file uploaded' });
    }

    const { name, description, user_id } = req.body;
    const filePath = req.file.path;

    try {
        const script = new SeleniumScript({
            name,
            description,
            file_path: filePath,
            uploaded_by: user_id || null
        });

        await script.save();
        res.json({ script_id: script._id, message: 'Script uploaded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.runTest = async (req, res) => {
    const { script_id, browsers, target_url, user_id } = req.body;

    if (!script_id || !browsers || browsers.length === 0) {
        return res.status(400).json({ error: 'Missing script_id or browsers' });
    }

    try {
        const script = await SeleniumScript.findById(script_id);
        if (!script) return res.status(404).json({ error: 'Script not found' });

        const job = new SeleniumJob({
            script_id,
            user_id: user_id || null,
            status: 'Pending'
        });

        await job.save();

        seleniumService.executeTest(job._id, script.file_path, browsers, target_url);

        res.json({ job_id: job._id, message: 'Test execution started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getJobDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const job = await SeleniumJob.findById(id).lean();
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const executions = job.executions ? job.executions.map(e => ({
            ...e,
            execution_id: e._id
        })) : [];

        res.json({ ...job, job_id: job._id, executions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getScripts = async (req, res) => {
    try {
        const scripts = await SeleniumScript.find().sort({ uploaded_at: -1 }).lean();
        res.json(scripts.map(s => ({ ...s, script_id: s._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteJob = async (req, res) => {
    const { id } = req.params;
    try {
        await SeleniumJob.findByIdAndDelete(id);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
