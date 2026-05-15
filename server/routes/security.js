const express = require('express');
const router = express.Router();
const securityService = require('../services/securityService');
const multer = require('multer');

// Configure multer for file uploads (SAST)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET all scans
router.get('/scans', async (req, res) => {
    try {
        const scans = await securityService.getScans();
        res.json(scans);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET scan details
router.get('/scans/:id', async (req, res) => {
    try {
        const scan = await securityService.getScanDetails(req.params.id);
        if (!scan) return res.status(404).json({ error: 'Scan not found' });
        res.json(scan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/scans/:id', async (req, res) => {
    try {
        await securityService.deleteScan(req.params.id);
        res.json({ message: 'Scan deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Run SAST Scan (Upload or Text)
router.post('/scan/sast', upload.single('codeFile'), async (req, res) => {
    try {
        let code = '';
        let filename = 'Snippet';

        if (req.file) {
            code = req.file.buffer.toString('utf8');
            filename = req.file.originalname;
        } else if (req.body.code) {
            code = req.body.code;
            filename = req.body.filename || 'Pasted Code';
        } else {
            return res.status(400).json({ error: 'No code provided' });
        }

        const result = await securityService.startSastScan(filename, code);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST Run DAST Scan (URL)
router.post('/scan/dast', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const result = await securityService.startDastScan(url);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
