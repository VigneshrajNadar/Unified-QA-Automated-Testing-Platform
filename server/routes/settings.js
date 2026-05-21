const express = require('express');
const Setting = require('../models/Setting');

const router = express.Router();

// Get Settings
router.get('/', async (req, res) => {
    try {
        const settings = await Setting.findOne({ user_id: req.user.userId }).lean();
        
        if (!settings) {
            // Return defaults if no settings found
            return res.json({
                coverage_threshold: 80,
                complexity_threshold: 10,
                security_strictness: 'High',
                notifications_enabled: true,
                rtm_strictness: 'Strict'
            });
        }

        // Map boolean back to int for frontend compatibility if needed
        res.json({
            ...settings,
            notifications_enabled: settings.notifications_enabled ? 1 : 0
        });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Update Settings
router.post('/', async (req, res) => {
    const { coverage_threshold, complexity_threshold, security_strictness, notifications_enabled, rtm_strictness } = req.body;
    const userId = req.user.userId;

    try {
        await Setting.findOneAndUpdate(
            { user_id: userId },
            {
                coverage_threshold,
                complexity_threshold,
                security_strictness,
                notifications_enabled: !!notifications_enabled,
                rtm_strictness: rtm_strictness || 'Strict',
                updated_at: Date.now()
            },
            { upsert: true, new: true }
        );

        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Database error: ' + err.message });
    }
});

module.exports = router;
