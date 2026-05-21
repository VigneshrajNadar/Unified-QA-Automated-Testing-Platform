const express = require('express');
const Defect = require('../models/Defect');

const router = express.Router();

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
        detection_source
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
            reported_by: req.user ? req.user.userId : null
        });

        await newDefect.save();
        res.status(201).json({ message: 'Defect created successfully', defectId: newDefect._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get All Defects
router.get('/', async (req, res) => {
    const { project_id } = req.query;

    try {
        let filter = {};

        // Only filter by project if provided - show ALL defects to all users
        if (project_id) {
            filter.project_id = project_id;
        }

        const defects = await Defect.find(filter)
            .populate('assigned_to', 'name')
            .populate('assignee_id', 'name')
            .populate('test_case_id', 'title')
            .populate('project_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const formatted = defects.map(d => ({
            ...d,
            defect_id: d._id,
            assignee_name: (d.assigned_to ? d.assigned_to.name : null) || 
                           (d.assignee_id ? d.assignee_id.name : null) || 'Unassigned',
            test_case_title: d.test_case_id ? d.test_case_id.title : null,
            project_name: d.project_id ? d.project_id.name : null
        }));

        res.json(formatted);
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
            { $set: updateData },
            { new: true }
        );

        if (!defect) {
            return res.status(404).json({ message: 'Defect not found' });
        }
        res.json({ message: 'Defect updated successfully' });
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
