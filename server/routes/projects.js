const express = require('express');
const Project = require('../models/Project');

const router = express.Router();

// Get all projects
router.get('/', async (req, res) => {
    try {
        let filter = {};
        if (req.user && req.user.role && req.user.role.toLowerCase() !== 'admin') {
            // For now, if not admin, only show projects they created (assignee_id not implemented in schema yet)
            filter.created_by = req.user.userId;
        }

        const projects = await Project.find(filter)
                                      .populate('created_by', 'name')
                                      .sort({ created_at: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Create a project
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    try {
        const newProject = new Project({
            name,
            description,
            created_by: req.user ? req.user.userId : null
        });
        await newProject.save();
        res.status(201).json({ message: 'Project created', projectId: newProject._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Update a project
router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    const projectId = req.params.id;

    try {
        const project = await Project.findByIdAndUpdate(
            projectId, 
            { name, description, updated_at: Date.now() }, 
            { new: true }
        );
        
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get project details
router.get('/:id', async (req, res) => {
    const projectId = req.params.id;

    try {
        const project = await Project.findById(projectId).lean();
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Placeholder for modules since Module model isn't implemented yet
        res.json({ ...project, modules: [] });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    if (req.user && req.user.role && req.user.role.toLowerCase() === 'tester') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const result = await Project.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;
