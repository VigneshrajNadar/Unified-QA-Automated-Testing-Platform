const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload Attachment
router.post('/upload', upload.single('file'), (req, res) => {
    const { entity_type, entity_id } = req.body;

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!entity_type || !entity_id) return res.status(400).json({ message: 'Entity type and ID required' });

    const filePath = req.file.filename;

    db.run(`INSERT INTO attachments (entity_type, entity_id, file_path) VALUES (?, ?, ?)`,
        [entity_type, entity_id, filePath], function (err) {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });
            res.status(201).json({ message: 'File uploaded', attachmentId: this.lastID, filePath });
        });
});

// Get Attachments for Entity
router.get('/:entity_type/:entity_id', (req, res) => {
    const { entity_type, entity_id } = req.params;
    db.all(`SELECT * FROM attachments WHERE entity_type = ? AND entity_id = ?`, [entity_type, entity_id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

module.exports = router;
