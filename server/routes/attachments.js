const express = require('express');
const multer = require('multer');
const path = require('path');
const Attachment = require('../models/Attachment');

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
router.post('/upload', upload.single('file'), async (req, res) => {
    const { entity_type, entity_id } = req.body;

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!entity_type || !entity_id) return res.status(400).json({ message: 'Entity type and ID required' });

    const filePath = req.file.filename;

    try {
        const attachment = new Attachment({
            entity_type,
            entity_id,
            file_path: filePath
        });

        await attachment.save();
        res.status(201).json({ message: 'File uploaded', attachmentId: attachment._id, filePath });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

// Get Attachments for Entity
router.get('/:entity_type/:entity_id', async (req, res) => {
    const { entity_type, entity_id } = req.params;
    
    try {
        const attachments = await Attachment.find({ entity_type, entity_id }).sort({ uploaded_at: -1 }).lean();
        
        // Map _id to attachment_id for frontend consistency
        res.json(attachments.map(a => ({ ...a, attachment_id: a._id })));
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

module.exports = router;
