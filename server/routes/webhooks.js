const express = require('express');
const router = express.Router();
const Webhook = require('../models/Webhook');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
    try {
        const hooks = await Webhook.find().sort({ created_at: -1 });
        res.json(hooks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, url, events, secret } = req.body;
        const hook = new Webhook({
            name,
            url,
            events: events || [],
            secret: secret || '',
            created_by: req.user ? req.user.userId : null
        });
        await hook.save();
        res.status(201).json(hook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/toggle', verifyToken, async (req, res) => {
    try {
        const hook = await Webhook.findById(req.params.id);
        if (!hook) return res.status(404).json({ error: 'Webhook not found' });

        hook.is_active = !hook.is_active;
        await hook.save();
        res.json(hook);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Webhook.findByIdAndDelete(req.params.id);
        res.json({ message: 'Webhook deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper for other services to emit webhooks
const axios = require('axios');
const crypto = require('crypto');

router.emitEvent = async (eventName, payload) => {
    try {
        const activeHooks = await Webhook.find({ is_active: true, events: eventName });
        for (const hook of activeHooks) {
            const headers = { 'Content-Type': 'application/json' };
            if (hook.secret) {
                const signature = crypto.createHmac('sha256', hook.secret).update(JSON.stringify(payload)).digest('hex');
                headers['X-Hub-Signature'] = `sha256=${signature}`;
            }
            // Fire and forget
            axios.post(hook.url, { event: eventName, payload }, { headers }).catch(e => console.error(`Webhook ${hook.name} failed:`, e.message));
        }
    } catch (error) {
        console.error('Error emitting webhook:', error);
    }
};

module.exports = router;
