const express = require('express');
const db = require('../database');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get Current User Profile
router.get('/profile', (req, res) => {
    db.get('SELECT user_id, name, email, role, created_at FROM users WHERE user_id = ?', [req.user.userId], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!row) return res.status(404).json({ message: 'User not found' });
        res.json(row);
    });
});

// Update Current User Profile
router.put('/profile', async (req, res) => {
    const { name, password } = req.body;

    if (!name) return res.status(400).json({ message: 'Name is required' });

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run('UPDATE users SET name = ?, password = ? WHERE user_id = ?', [name, hashedPassword, req.user.userId], (err) => {
                if (err) return res.status(500).json({ message: 'Database error' });
                res.json({ message: 'Profile updated successfully' });
            });
        } else {
            db.run('UPDATE users SET name = ? WHERE user_id = ?', [name, req.user.userId], (err) => {
                if (err) return res.status(500).json({ message: 'Database error' });
                res.json({ message: 'Profile updated successfully' });
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Users for "Assign To" Dropdown
router.get('/assignable', (req, res) => {
    db.all('SELECT user_id, name, role FROM users ORDER BY name ASC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Admin: Get All Users
router.get('/', (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    db.all('SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Admin: Delete User
router.delete('/:id', (req, res) => {
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });

    if (parseInt(req.params.id) === req.user.userId) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    db.run('DELETE FROM users WHERE user_id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'User deleted' });
    });
});

module.exports = router;
