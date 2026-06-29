const express = require('express');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// Get comments for an entity
router.get('/:entityType/:entityId', async (req, res) => {
    try {
        const comments = await Comment.find({
            entity_type: req.params.entityType,
            entity_id: req.params.entityId
        })
        .populate('author_id', 'name role')
        .sort({ created_at: 1 })
        .lean();

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Create comment
router.post('/', async (req, res) => {
    const { entity_type, entity_id, content, url_path } = req.body;
    try {
        const newComment = new Comment({
            entity_type,
            entity_id,
            content,
            author_id: req.user.userId
        });
        await newComment.save();
        
        // Parse @mentions
        const mentionMatches = content.match(/@(\w+)/g);
        if (mentionMatches && mentionMatches.length > 0) {
            const usernames = mentionMatches.map(m => m.substring(1));
            const users = await User.find({ name: { $in: usernames.map(n => new RegExp('^' + n + '$', 'i')) } });
            
            for (const u of users) {
                // Don't notify self
                if (u._id.toString() !== req.user.userId) {
                    await Notification.create({
                        user_id: u._id,
                        title: `New Mention in ${entity_type}`,
                        message: `${req.user.name || 'Someone'} mentioned you: "${content.substring(0, 50)}..."`,
                        link: url_path || `/${entity_type}s`,
                        type: 'mention'
                    });
                }
            }
        }
        
        const populated = await Comment.findById(newComment._id).populate('author_id', 'name role').lean();
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Delete comment
router.delete('/:id', async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;
