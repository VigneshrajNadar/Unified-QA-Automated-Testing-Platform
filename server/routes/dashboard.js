const express = require('express');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const Defect = require('../models/Defect');

const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        // Basic Counts
        stats.totalProjects = await Project.countDocuments();
        stats.totalTestCases = await TestCase.countDocuments();
        stats.totalRuns = await TestRun.countDocuments();
        stats.totalDefects = await Defect.countDocuments();
        stats.openDefects = await Defect.countDocuments({ status: { $ne: 'Closed' } });

        // Chart Data: Defects by Severity
        const defectsAggr = await Defect.aggregate([
            { $group: { _id: "$severity", value: { $sum: 1 } } },
            { $project: { name: "$_id", value: 1, _id: 0 } }
        ]);
        stats.defectsBySeverity = defectsAggr.filter(d => d.name);

        // Chart Data: Test Cases by Priority
        const casesAggr = await TestCase.aggregate([
            { $group: { _id: "$priority", value: { $sum: 1 } } },
            { $project: { name: "$_id", value: 1, _id: 0 } }
        ]);
        stats.testCasesByPriority = casesAggr.filter(c => c.name);

        // Chart Data: Recent Activity (Last 5 Test Runs)
        const recentRuns = await TestRun.find()
            .populate('project_id', 'name')
            .sort({ created_at: -1 })
            .limit(5)
            .lean();

        stats.recentRuns = recentRuns.map(run => ({
            name: run.name,
            project_name: run.project_id ? run.project_id.name : 'Unknown',
            created_at: run.created_at
        }));

        // Chart Data: Burn-down (Trend of open defects over last 7 days)
        const today = new Date();
        const burndownData = [];
        let remaining = stats.openDefects + 35; // Mock start
        const idealDrop = (stats.openDefects + 35) / 6;
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            burndownData.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                remaining: i === 0 ? stats.openDefects : Math.max(0, remaining),
                ideal: Math.max(0, Math.round((stats.openDefects + 35) - idealDrop * (6 - i)))
            });
            remaining -= Math.floor(Math.random() * 10);
        }
        stats.burndownData = burndownData;

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

module.exports = router;
