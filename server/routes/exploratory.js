const express = require('express');
const router = express.Router();
const ExploratorySession = require('../models/ExploratorySession');

// Get all sessions for a project
router.get('/:projectId', async (req, res) => {
    try {
        const sessions = await ExploratorySession.find({ project_id: req.params.projectId })
            .populate('tester_id', 'name')
            .sort({ start_time: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start a new session
router.post('/', async (req, res) => {
    const { project_id, charter } = req.body;
    try {
        const session = new ExploratorySession({
            project_id,
            charter,
            start_time: new Date(),
            tester_id: req.user.userId
        });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a note/bug to a session
router.post('/:id/notes', async (req, res) => {
    const { content, type } = req.body;
    try {
        const session = await ExploratorySession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        
        session.notes.push({ content, type });
        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End a session
router.post('/:id/end', async (req, res) => {
    try {
        const session = await ExploratorySession.findById(req.params.id);
        if (!session) return res.status(404).json({ message: 'Session not found' });
        
        session.end_time = new Date();
        session.status = 'Completed';
        const durationMs = session.end_time - session.start_time;
        session.duration_minutes = Math.round(durationMs / 60000);
        
        await session.save();
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
