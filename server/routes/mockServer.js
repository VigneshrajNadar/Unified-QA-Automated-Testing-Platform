const express = require('express');
const router = express.Router();
const MockEndpoint = require('../models/MockEndpoint');
const requireRole = require('../middleware/roleMiddleware');

// ============================================
// MOCK ENDPOINT MANAGEMENT
// ============================================

router.get('/endpoints', async (req, res) => {
    try {
        const endpoints = await MockEndpoint.find().sort({ created_at: -1 });
        res.json(endpoints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/endpoints', async (req, res) => {
    try {
        // ensure endpoint starts with /
        let ep = req.body.endpoint;
        if (!ep.startsWith('/')) ep = '/' + ep;

        const newEp = new MockEndpoint({
            ...req.body,
            endpoint: ep,
            created_by: req.user ? req.user.userId : null
        });
        await newEp.save();
        res.status(201).json(newEp);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/endpoints/:id', async (req, res) => {
    try {
        let ep = req.body.endpoint;
        if (ep && !ep.startsWith('/')) ep = '/' + ep;
        
        const updated = await MockEndpoint.findByIdAndUpdate(req.params.id, {
            ...req.body,
            endpoint: ep
        }, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/endpoints/:id', async (req, res) => {
    try {
        await MockEndpoint.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/endpoints/:id/toggle', async (req, res) => {
    try {
        const ep = await MockEndpoint.findById(req.params.id);
        if (!ep) return res.status(404).json({ error: 'Not found' });
        ep.is_active = !ep.is_active;
        await ep.save();
        res.json(ep);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
