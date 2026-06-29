const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// Helper: Write an audit event (called from other routes)
const writeAudit = async ({ user_id, action, entity, entity_id, details, ip }) => {
    try {
        await AuditLog.create({
            user_id,
            action,
            entity,
            entity_id: entity_id ? String(entity_id) : undefined,
            details,
            ip_address: ip || '127.0.0.1'
        });
    } catch (e) {
        console.error('[AuditLog] Write failed:', e.message);
    }
};

// Get all audit logs (admin)
router.get('/', async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(200)
            .populate('user_id', 'name email role')
            .lean();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Seed demo audit entries so the ledger is never empty
router.post('/seed-demo', async (req, res) => {
    try {
        const count = await AuditLog.countDocuments();
        if (count >= 10) return res.json({ message: 'Already seeded' });

        const demoEvents = [
            { action: 'User Login',        entity: 'User',    details: 'admin@meghana.com logged in successfully',           ip_address: '192.168.1.1' },
            { action: 'Create Defect',     entity: 'Defect',  entity_id: 'def001', details: 'Defect "Login button unresponsive" created', ip_address: '10.0.0.5' },
            { action: 'Update Test Case',  entity: 'TestCase',entity_id: 'tc0023', details: 'Status changed from Draft → Active', ip_address: '10.0.0.5' },
            { action: 'Delete Test Run',   entity: 'TestRun', entity_id: 'run045', details: 'Test run deleted by admin',              ip_address: '192.168.1.1' },
            { action: 'User Login Failed', entity: 'User',    details: 'Failed login attempt for unknown@mail.com',          ip_address: '203.0.113.42' },
            { action: 'Create Project',    entity: 'Project', entity_id: 'prj012', details: 'Project "E-Commerce V2" created',        ip_address: '10.0.0.5' },
            { action: 'Update Settings',   entity: 'Settings',details: 'Coverage threshold changed to 85%',                  ip_address: '192.168.1.1' },
            { action: 'Export Report',     entity: 'Report',  details: 'Burndown CSV exported by admin',                     ip_address: '10.0.0.8' },
            { action: 'Add User Role',     entity: 'Role',    details: 'Role "Senior Tester" created',                       ip_address: '192.168.1.1' },
            { action: 'Create Test Run',   entity: 'TestRun', entity_id: 'run046', details: 'Regression Suite v3 started',             ip_address: '10.0.0.5' },
            { action: 'Update Defect',     entity: 'Defect',  entity_id: 'def001', details: 'Severity changed to Critical, assigned to dev@meghana.com', ip_address: '10.0.0.6' },
            { action: 'User Logout',       entity: 'User',    details: 'tester@meghana.com session ended',                   ip_address: '10.0.0.7' },
        ];

        await AuditLog.insertMany(demoEvents);
        res.json({ message: `Seeded ${demoEvents.length} demo audit events` });
    } catch (err) {
        res.status(500).json({ error: 'Seed failed: ' + err.message });
    }
});

// Internal POST endpoint to log from other routes
router.post('/log', async (req, res) => {
    try {
        const { action, entity, entity_id, details } = req.body;
        await writeAudit({
            user_id: req.user?.userId,
            action,
            entity,
            entity_id,
            details,
            ip: req.ip
        });
        res.json({ message: 'Action logged' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to log action' });
    }
});

module.exports = router;
module.exports.writeAudit = writeAudit;
