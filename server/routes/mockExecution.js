const express = require('express');
const router = express.Router();
const MockEndpoint = require('../models/MockEndpoint');

router.all(/.*/, async (req, res) => {
    try {
        const method = req.method;
        const endpointPath = req.path; // e.g., /users

        // Find an active mock endpoint matching the path and method
        const mock = await MockEndpoint.findOne({
            method: method,
            endpoint: endpointPath,
            is_active: true
        });

        if (!mock) {
            return res.status(404).json({ error: 'Mock endpoint not found or inactive' });
        }

        // Apply delay
        if (mock.delay_ms && mock.delay_ms > 0) {
            await new Promise(resolve => setTimeout(resolve, mock.delay_ms));
        }

        // Apply headers
        if (mock.headers) {
            try {
                const headersObj = JSON.parse(mock.headers);
                Object.entries(headersObj).forEach(([key, val]) => {
                    res.setHeader(key, val);
                });
            } catch (e) {
                // Ignore invalid headers
            }
        }

        // Send response body
        let bodyToSend = mock.response_body;
        try {
            // Try to parse as JSON so it sends proper application/json if it is JSON
            bodyToSend = JSON.parse(mock.response_body);
        } catch (e) {
            // Send as string
        }

        res.status(mock.status_code || 200).send(bodyToSend);
    } catch (error) {
        res.status(500).json({ error: 'Mock Execution Error: ' + error.message });
    }
});

module.exports = router;
