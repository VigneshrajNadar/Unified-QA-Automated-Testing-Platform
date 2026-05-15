const express = require('express');
const router = express.Router();
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

// Get Settings
router.get('/', (req, res) => {
    db.get('SELECT * FROM settings WHERE user_id = ?', [req.user.userId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!row) {
            // Return defaults if no settings found
            return res.json({
                coverage_threshold: 80,
                complexity_threshold: 10,
                security_strictness: 'High',
                notifications_enabled: 1,
                rtm_strictness: 'Strict'
            });
        }
        res.json(row);
    });
});

// Update Settings
router.post('/', (req, res) => {
    const { coverage_threshold, complexity_threshold, security_strictness, notifications_enabled, rtm_strictness } = req.body;
    const userId = req.user.userId;

    db.run(`INSERT INTO settings (user_id, coverage_threshold, complexity_threshold, security_strictness, notifications_enabled, rtm_strictness)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
            coverage_threshold = excluded.coverage_threshold,
            complexity_threshold = excluded.complexity_threshold,
            security_strictness = excluded.security_strictness,
            notifications_enabled = excluded.notifications_enabled,
            rtm_strictness = excluded.rtm_strictness`,
        [userId, coverage_threshold, complexity_threshold, security_strictness, notifications_enabled, rtm_strictness || 'Strict'],
        function (err) {
            if (err) return res.status(500).json({ message: 'Database error: ' + err.message });
            res.json({ message: 'Settings updated successfully' });
        }
    );
});

module.exports = router;
