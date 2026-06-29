// Polyfill for MongoDB driver on some Node environments (like Render)
if (typeof crypto === 'undefined') {
    global.crypto = require('crypto');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./database');

// Connect to MongoDB
connectDB().then(async () => {
    // Auto-seed audit demo data if empty
    try {
        const AuditLog = require('./models/AuditLog');
        const count = await AuditLog.countDocuments();
        if (count === 0) {
            const demoEvents = [
                { action: 'User Login',        entity: 'User',    details: 'admin@meghana.com logged in successfully',                           ip_address: '192.168.1.1' },
                { action: 'Create Defect',     entity: 'Defect',  entity_id: 'def001', details: 'Defect "Login button unresponsive" created',   ip_address: '10.0.0.5'   },
                { action: 'Update Test Case',  entity: 'TestCase',entity_id: 'tc0023', details: 'Status changed from Draft → Active',           ip_address: '10.0.0.5'   },
                { action: 'Delete Test Run',   entity: 'TestRun', entity_id: 'run045', details: 'Test run deleted by admin',                    ip_address: '192.168.1.1' },
                { action: 'User Login Failed', entity: 'User',    details: 'Failed login attempt for unknown@mail.com',                         ip_address: '203.0.113.42'},
                { action: 'Create Project',    entity: 'Project', entity_id: 'prj012', details: 'Project "E-Commerce V2" created',              ip_address: '10.0.0.5'   },
                { action: 'Update Settings',   entity: 'Settings',details: 'Coverage threshold changed to 85%',                                 ip_address: '192.168.1.1' },
                { action: 'Export Report',     entity: 'Report',  details: 'Burndown CSV exported by admin',                                    ip_address: '10.0.0.8'   },
                { action: 'Add User Role',     entity: 'Role',    details: 'Role "Senior Tester" created',                                      ip_address: '192.168.1.1' },
                { action: 'Create Test Run',   entity: 'TestRun', entity_id: 'run046', details: 'Regression Suite v3 started',                  ip_address: '10.0.0.5'   },
                { action: 'Update Defect',     entity: 'Defect',  entity_id: 'def001', details: 'Severity → Critical, assigned dev@meghana.com',ip_address: '10.0.0.6'   },
                { action: 'User Logout',       entity: 'User',    details: 'tester@meghana.com session ended',                                  ip_address: '10.0.0.7'   },
            ];
            await AuditLog.insertMany(demoEvents);
            console.log('✅ Audit log seeded with demo events');
        }
    } catch (e) {
        console.error('Audit seed error:', e.message);
    }
});

// Initialize Scheduler
const { initScheduler } = require('./services/monitorScheduler');
// Wait for DB to be ready roughly (or just start it)
setTimeout(() => initScheduler(), 2000);

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authenticateToken = require('./middleware/authMiddleware');

const app = express();
app.set('trust proxy', 1); // Trust Render's proxy for rate limiting
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,  // Allow cross-origin resource sharing
    contentSecurityPolicy: false       // Disable CSP to allow Vercel frontend
}));

// CORS - Allow all origins (Vercel + local dev)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

app.use(express.json({ limit: '10kb' }));

// DDoS Protection (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 99999, // Disabled for local development
    message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// Routes
// 1. Public Routes (Auth)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mock', require('./routes/mockExecution')); // Publicly available execution for mocks
app.use('/api/roles', require('./routes/roles'));
app.use('/api/webhooks', require('./routes/webhooks'));

// 2. Protected Routes (Barrier)
app.use('/api', authenticateToken);

// 3. API Modules (Protected)
const requireRole = require('./middleware/roleMiddleware');

// Accessible by Admin, Tester, Developer
const allRoles = ['Admin', 'Tester', 'Developer'];
app.use('/api/dashboard', requireRole(...allRoles), require('./routes/dashboard'));
app.use('/api/projects', requireRole(...allRoles), require('./routes/projects'));
app.use('/api/defects', requireRole(...allRoles), require('./routes/defects'));
app.use('/api/requirements', requireRole(...allRoles), require('./routes/requirements'));
app.use('/api/sprints', requireRole(...allRoles), require('./routes/sprints'));
app.use('/api/comments', requireRole(...allRoles), require('./routes/comments'));
app.use('/api/ai', requireRole(...allRoles), require('./routes/ai'));
app.use('/api/tia', requireRole(...allRoles), require('./routes/tia'));
app.use('/api/settings', requireRole(...allRoles), require('./routes/settings'));
app.use('/api/docs', requireRole(...allRoles), require('./routes/docs'));
app.use('/api/attachments', requireRole(...allRoles), require('./routes/attachments'));
app.use('/api/api-testing', requireRole(...allRoles), require('./routes/apiTesting'));
app.use('/api/mockServer', requireRole(...allRoles), require('./routes/mockServer'));

// Accessible by Admin, Tester
const testerRoles = ['Admin', 'Tester'];
app.use('/api/testcases', requireRole(...testerRoles), require('./routes/testcases'));
app.use('/api/runs', requireRole(...testerRoles), require('./routes/runs'));
app.use('/api/visual', requireRole(...testerRoles), require('./routes/visualTesting'));
app.use('/api/performance', requireRole(...testerRoles), require('./routes/performance'));
app.use('/api/selenium', requireRole(...testerRoles), require('./routes/seleniumRoutes'));
app.use('/api/ecommerce', requireRole(...testerRoles), require('./routes/ecommerceRoutes'));
app.use('/api/exploratory', requireRole(...testerRoles), require('./routes/exploratory'));

// Accessible by Admin, Developer
const devRoles = ['Admin', 'Developer'];
app.use('/api/autotest', requireRole(...devRoles), require('./routes/autotest'));
app.use('/api/security', requireRole(...devRoles), require('./routes/security'));
app.use('/api/notifications', requireRole(...allRoles), require('./routes/notifications'));

app.use('/api/users', requireRole(...allRoles), require('./routes/users'));
app.use('/api/monitor', requireRole('Admin'), require('./routes/webMonitorRoutes'));
app.use('/api/reports', requireRole('Admin'), require('./routes/reports'));
app.use('/api/system', requireRole('Admin'), require('./routes/system').router);
app.use('/api/audit', requireRole('Admin'), require('./routes/audit'));

// Mobile Testing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/ecommerce/reports', express.static(path.join(__dirname, 'ecommerce-automation/reports'))); // Serve Reports

app.get('/', (req, res) => {
    res.send('QA Tool API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
