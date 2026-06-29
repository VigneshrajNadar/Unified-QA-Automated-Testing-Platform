const express = require('express');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Get unread notifications for current user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user.userId, read: false })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark as read
router.put('/:id/read', authMiddleware, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.userId },
            { read: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Mark all as read
router.post('/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user.userId, read: false },
            { read: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

module.exports = router;
