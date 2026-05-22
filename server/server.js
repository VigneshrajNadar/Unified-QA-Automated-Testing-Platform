// Polyfill for MongoDB driver on some Node environments (like Render)
if (typeof crypto === 'undefined') {
    global.crypto = require('crypto');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./database');

// Connect to MongoDB
connectDB();

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

// 2. Protected Routes (Barrier)
app.use('/api', authenticateToken);

// 3. API Modules (Protected)
app.use('/api/projects', require('./routes/projects'));
app.use('/api/testcases', require('./routes/testcases'));
app.use('/api/runs', require('./routes/runs'));
app.use('/api/defects', require('./routes/defects'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/docs', require('./routes/docs'));
app.use('/api/attachments', require('./routes/attachments'));
app.use('/api/requirements', require('./routes/requirements'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/autotest', require('./routes/autotest'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/visual', require('./routes/visualTesting'));
app.use('/api/api-testing', require('./routes/apiTesting'));
app.use('/api/selenium', require('./routes/seleniumRoutes'));
app.use('/api/monitor', require('./routes/webMonitorRoutes'));
app.use('/api/ecommerce', require('./routes/ecommerceRoutes'));
app.use('/api/performance', require('./routes/performance'));
app.use('/api/security', require('./routes/security'));
// Mobile Testing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/ecommerce/reports', express.static(path.join(__dirname, '../ecommerce-automation/reports'))); // Serve Reports

app.get('/', (req, res) => {
    res.send('QA Tool API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
