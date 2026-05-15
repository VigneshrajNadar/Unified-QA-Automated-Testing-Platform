const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

router.post('/generate', (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    const scriptPath = path.join(__dirname, '../services/aiGenerator.py');
    const pythonProcess = spawn('python', [scriptPath, prompt]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}: ${errorString}`);
            return res.status(500).json({ error: 'Failed to generate test cases', details: errorString });
        }
        res.json({ result: dataString });
    });
});

module.exports = router;
