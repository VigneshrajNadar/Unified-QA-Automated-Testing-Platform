const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const router = express.Router();

// Get Current User Profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json({ ...user, user_id: user._id });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Update Current User Profile
router.put('/profile', async (req, res) => {
    const { name, password } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        const updateData = { name };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await User.findByIdAndUpdate(req.user.userId, updateData);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get Users for "Assign To" Dropdown
router.get('/assignable', async (req, res) => {
    try {
        const users = await User.find().select('name role').sort({ name: 1 }).lean();
        res.json(users.map(u => ({ ...u, user_id: u._id })));
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Admin: Get All Users
router.get('/', async (req, res) => {
    if (req.user.role && req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const users = await User.find().select('-password').sort({ created_at: -1 }).lean();
        res.json(users.map(u => ({ ...u, user_id: u._id })));
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Admin: Delete User
router.delete('/:id', async (req, res) => {
    if (req.user.role && req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    if (req.params.id === req.user.userId.toString()) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

module.exports = router;
