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

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

module.exports = router;
