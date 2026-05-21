const WebMonitorJob = require('../models/WebMonitorJob');
const webMonitorService = require('../services/webMonitorService');

exports.startScan = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const job = new WebMonitorJob({ url });
        await job.save();

        webMonitorService.runScan(job._id, url);

        res.json({ job_id: job._id, message: 'Scan started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getScans = async (req, res) => {
    try {
        const scans = await WebMonitorJob.find().select('-links').sort({ created_at: -1 }).limit(20).lean();
        res.json(scans.map(s => ({
            ...s,
            job_id: s._id,
            health_score: s.health_score || s.seo_score || 0  // normalize field name for frontend
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getScanDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const job = await WebMonitorJob.findById(id).lean();
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Normalize link fields for frontend compatibility
        const links = (job.links || []).map(l => ({
            ...l,
            result_id: l._id,
            url: l.link_url || l.url,          // frontend uses link.url
            status_code: l.status_code,
            status: l.status,
            response_time: l.response_time || null
        }));

        res.json({
            ...job,
            job_id: job._id,
            health_score: job.health_score || job.seo_score || 0,  // normalize for frontend
            links
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteJob = async (req, res) => {
    const { id } = req.params;
    try {
        await WebMonitorJob.findByIdAndDelete(id);
        res.json({ message: 'Scan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
