const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const os = require('os');

// Helper to log audit events
const logAudit = async (req, action, entity_type, entity_id, details = {}) => {
    try {
        const log = new AuditLog({
            user_id: req.user ? req.user.userId : null,
            user_name: req.user ? req.user.name : 'System',
            action,
            entity_type,
            entity_id,
            details,
            ip_address: req.ip || req.connection.remoteAddress
        });
        await log.save();
    } catch (e) {
        console.error('Audit Log Error:', e);
    }
};

// GET /api/system/health
router.get('/health', async (req, res) => {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        const health = {
            status: 'Operational',
            uptime: Math.floor(process.uptime()),
            cpu: os.cpus().length + ' Cores',
            memory: {
                total: Math.floor(totalMem / (1024 * 1024)),
                used: Math.floor(usedMem / (1024 * 1024)),
                percentage: Math.round((usedMem / totalMem) * 100)
            },
            platform: os.platform()
        };
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/system/audit
router.get('/audit', async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ created_at: -1 }).limit(50).lean();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = { router, logAudit };
