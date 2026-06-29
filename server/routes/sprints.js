const express = require('express');
const Sprint = require('../models/Sprint');
const Defect = require('../models/Defect');
const TestCase = require('../models/TestCase');

const router = express.Router();

// Get all sprints for a project
router.get('/:projectId', async (req, res) => {
    try {
        const sprints = await Sprint.find({ project_id: req.params.projectId }).sort({ created_at: -1 }).lean();
        res.json(sprints);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Create sprint
router.post('/', async (req, res) => {
    const { project_id, name, goal, start_date, end_date } = req.body;
    try {
        const newSprint = new Sprint({ project_id, name, goal, start_date, end_date });
        await newSprint.save();
        res.status(201).json({ message: 'Sprint created', sprintId: newSprint._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Update sprint
router.put('/:id', async (req, res) => {
    try {
        const sprint = await Sprint.findByIdAndUpdate(
            req.params.id,
            { $set: { ...req.body, updated_at: Date.now() } },
            { new: true }
        );
        if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
        res.json({ message: 'Sprint updated' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Delete sprint
router.delete('/:id', async (req, res) => {
    try {
        await Sprint.findByIdAndDelete(req.params.id);
        // Remove sprint association from defects
        await Defect.updateMany({ sprint_id: req.params.id }, { $set: { sprint_id: null } });
        res.json({ message: 'Sprint deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get board data (sprint + defects)
// Handle both /board/:projectId and /board/:projectId/:sprintId
router.get('/board/:projectId', async (req, res) => {
    // This will handle the route without sprintId
    try {
        const activeSprint = await Sprint.findOne({ project_id: req.params.projectId, status: 'Active' });
        const sprintId = activeSprint ? activeSprint._id : null;
        return handleBoardData(req, res, req.params.projectId, sprintId);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.get('/board/:projectId/:sprintId', async (req, res) => {
    let sprintId = req.params.sprintId;
    if (sprintId === 'active') {
        try {
            const activeSprint = await Sprint.findOne({ project_id: req.params.projectId, status: 'Active' });
            sprintId = activeSprint ? activeSprint._id : null;
        } catch (error) {
            return res.status(500).json({ message: 'Database error', error: error.message });
        }
    }
    return handleBoardData(req, res, req.params.projectId, sprintId);
});

async function handleBoardData(req, res, projectId, sprintId) {
    try {
        const filter = { project_id: projectId };
        if (sprintId) filter.sprint_id = sprintId;

        const defects = await Defect.find(filter)
            .populate('assigned_to', 'name')
            .populate('assignee_id', 'name')
            .lean();

        const testCases = await TestCase.find(filter)
            .populate('created_by', 'name')
            .lean();

        const formattedDefects = defects.map(issue => ({
            ...issue,
            id: issue._id.toString(), // frontend dnd usually needs string ids
            itemModel: 'Defect', // identifier
            assignee_name: (issue.assigned_to ? issue.assigned_to.name : null) || 
                           (issue.assignee_id ? issue.assignee_id.name : null) || 'Unassigned'
        }));

        const formattedTestCases = testCases.map(tc => ({
            ...tc,
            id: tc._id.toString(),
            itemModel: 'TestCase', // identifier
            issue_type: 'Test Case',
            assignee_name: tc.created_by ? tc.created_by.name : 'Unassigned'
        }));

        const allIssues = [...formattedDefects, ...formattedTestCases].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            sprintId,
            issues: allIssues
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
}

module.exports = router;
