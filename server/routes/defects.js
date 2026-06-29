const express = require('express');
const Defect = require('../models/Defect');
const Notification = require('../models/Notification');
const { callOpenRouter } = require('./ai');

const router = express.Router();

// Auto Triage using OpenRouter AI
router.post('/auto-triage', async (req, res) => {
    const { title, description, steps } = req.body;
    if (!title && !description) return res.status(400).json({ error: 'Title or description required for triage' });

    try {
        const fullPrompt = `You are an expert QA and DevOps Engineer. Analyze the following software defect and determine its Severity (Critical, High, Medium, Low) and Priority (High, Medium, Low). Also, provide a short Root Cause Analysis (RCA) or developer suggestion for how to fix it based on the details.

Title: ${title}
Description: ${description}
Steps: ${steps}

RETURN ONLY RAW JSON matching this schema exactly, with no markdown or text outside it:
{
    "severity": "High",
    "priority": "Medium",
    "rca_suggestion": "Short explanation of possible cause and fix"
}`;

        let content = await callOpenRouter([{ role: 'user', content: fullPrompt }]);

        if (content.startsWith('```json')) content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
        else if (content.startsWith('```')) content = content.replace(/^```\n/, '').replace(/\n```$/, '');

        res.json(JSON.parse(content));
    } catch (err) {
        console.error('Triage Error:', err.message);
        res.status(500).json({ error: 'Failed to auto-triage' });
    }
});

// Create Defect
router.post('/', async (req, res) => {
    const {
        project_id,
        test_case_id,
        test_run_id,
        title,
        description,
        severity,
        priority,
        status,
        assignee_id,
        steps,
        expected_result,
        actual_result,
        detection_source,
        branch_name,
        pr_link,
        ci_status
    } = req.body;

    if (!title || !severity || !priority) {
        return res.status(400).json({ message: 'Required fields missing (title, severity, priority)' });
    }

    try {
        const newDefect = new Defect({
            project_id: project_id || null,
            test_case_id: test_case_id || null,
            test_run_id: test_run_id || null,
            title,
            description,
            severity,
            priority,
            status: status || 'New',
            assignee_id: assignee_id || null,
            steps,
            expected_result,
            actual_result,
            branch_name,
            pr_link,
            ci_status: ci_status || null,
            reported_by: req.user ? req.user.userId : null
        });

        await newDefect.save();
        
        if (newDefect.assignee_id) {
            await Notification.create({
                user_id: newDefect.assignee_id,
                title: 'New Defect Assigned',
                message: `You have been assigned to defect: ${newDefect.title}`,
                link: '/defects',
                type: 'assignment'
            });
        }
        
        res.status(201).json({ message: 'Defect created successfully', defectId: newDefect._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get All Defects
router.get('/', async (req, res) => {
    const { project_id, limit, skip } = req.query;

    try {
        let filter = {};

        // Only filter by project if provided - show ALL defects to all users
        if (project_id) {
            filter.project_id = project_id;
        }

        const queryLimit = parseInt(limit) || 20;
        const querySkip = parseInt(skip) || 0;

        const [defects, total] = await Promise.all([
            Defect.find(filter)
                .populate('assigned_to', 'name')
                .populate('assignee_id', 'name')
                .populate('test_case_id', 'title')
                .populate('project_id', 'name')
                .sort({ created_at: -1 })
                .skip(querySkip)
                .limit(queryLimit)
                .lean(),
            Defect.countDocuments(filter)
        ]);

        const formatted = defects.map(d => ({
            ...d,
            defect_id: d._id,
            assignee_name: (d.assigned_to ? d.assigned_to.name : null) || 
                           (d.assignee_id ? d.assignee_id.name : null) || 'Unassigned',
            test_case_title: d.test_case_id ? d.test_case_id.title : null,
            project_name: d.project_id ? d.project_id.name : null
        }));

        res.json({ defects: formatted, total });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get Single Defect
router.get('/:id', async (req, res) => {
    try {
        const defect = await Defect.findById(req.params.id)
            .populate('assigned_to', 'name')
            .populate('assignee_id', 'name')
            .populate('test_case_id', 'title')
            .populate('project_id', 'name')
            .lean();

        if (!defect) {
            return res.status(404).json({ message: 'Defect not found' });
        }

        res.json({
            ...defect,
            defect_id: defect._id,
            assignee_name: (defect.assigned_to ? defect.assigned_to.name : null) ||
                           (defect.assignee_id ? defect.assignee_id.name : null) || 'Unassigned',
            test_case_title: defect.test_case_id ? defect.test_case_id.title : null,
            project_name: defect.project_id ? defect.project_id.name : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Update Defect
router.put('/:id', async (req, res) => {
    const defectId = req.params.id;
    const updateData = req.body;

    // Filter out undefined fields naturally handled by Mongoose
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }
    updateData.updated_at = Date.now();

    try {
        const defect = await Defect.findByIdAndUpdate(
            defectId,
            { 
                $set: updateData,
                $push: {
                    activity_log: {
                        action: `Defect updated`,
                        user_id: req.user ? req.user.userId : null,
                        user_name: req.user ? req.user.name : 'Unknown'
                    }
                }
            },
            { new: true }
        );

        if (!defect) {
            return res.status(404).json({ message: 'Defect not found' });
        }
        
        if (updateData.assignee_id) {
            await Notification.create({
                user_id: updateData.assignee_id,
                title: 'Defect Assignment Updated',
                message: `You have been assigned to defect: ${defect.title}`,
                link: '/defects',
                type: 'assignment'
            });
        }

        res.json({ message: 'Defect updated successfully', defect });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Reopen Defect
router.post('/:id/reopen', async (req, res) => {
    try {
        const defect = await Defect.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { status: 'Reopened', updated_at: Date.now() },
                $push: {
                    activity_log: {
                        action: 'Defect reopened',
                        user_id: req.user ? req.user.userId : null,
                        user_name: req.user ? req.user.name : 'Unknown'
                    }
                }
            },
            { new: true }
        );

        if (!defect) return res.status(404).json({ message: 'Defect not found' });
        res.json({ message: 'Defect reopened successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Delete Defect
router.delete('/:id', async (req, res) => {
    try {
        const result = await Defect.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ message: 'Defect not found' });
        }
        res.json({ message: 'Defect deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;
