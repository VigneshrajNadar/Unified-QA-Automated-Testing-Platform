const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Mongoose Models
const User = require('../models/User');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const Defect = require('../models/Defect');

const dbPath = path.join(__dirname, '../qa_tool.sqlite');
const sqlDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) console.error('Could not connect to SQLite:', err.message);
    else console.log('Connected to SQLite database.');
});

async function migrateData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Clear existing Mongo data to prevent duplicates during testing
        await User.deleteMany({});
        await Project.deleteMany({});
        await TestCase.deleteMany({});
        await TestRun.deleteMany({});
        await Defect.deleteMany({});

        // ID Maps
        const userMap = {};
        const projectMap = {};
        const testCaseMap = {};
        const testRunMap = {};

        // 1. Migrate Users
        console.log('Migrating Users...');
        const users = await querySql('SELECT * FROM users');
        for (const u of users) {
            const doc = new User({
                name: u.name,
                email: u.email,
                password: u.password_hash || u.password || 'password123',
                role: u.role,
                created_at: u.created_at
            });
            await doc.save();
            userMap[u.user_id] = doc._id;
        }

        // 2. Migrate Projects
        console.log('Migrating Projects...');
        const projects = await querySql('SELECT * FROM projects');
        for (const p of projects) {
            const doc = new Project({
                name: p.name,
                description: p.description,
                status: p.status,
                priority: p.priority || 'Medium',
                environment: p.environment || 'Production',
                created_by: userMap[p.created_by] || null,
                created_at: p.created_at
            });
            await doc.save();
            projectMap[p.project_id] = doc._id;
        }

        // 3. Migrate Test Cases
        console.log('Migrating Test Cases...');
        const fallbackProjectId = Object.values(projectMap)[0] || null;
        const testCases = await querySql('SELECT * FROM test_cases');
        for (const t of testCases) {
            const doc = new TestCase({
                project_id: projectMap[t.project_id] || fallbackProjectId,
                title: t.title,
                description: t.description,
                steps: t.steps,
                expected_result: t.expected_result,
                priority: t.priority,
                status: t.status,
                created_by: userMap[t.created_by] || null,
                created_at: t.created_at
            });
            await doc.save();
            testCaseMap[t.test_case_id] = doc._id;
        }

        // 4. Migrate Test Runs
        console.log('Migrating Test Runs...');
        const testRuns = await querySql('SELECT * FROM test_runs');
        for (const r of testRuns) {
            const doc = new TestRun({
                project_id: projectMap[r.project_id] || fallbackProjectId,
                name: r.name,
                description: r.description,
                status: r.status,
                environment: r.environment,
                browser: r.browser,
                started_at: r.started_at,
                completed_at: r.completed_at,
                created_by: userMap[r.executed_by] || null, // Assuming executed_by maps to created_by
                created_at: r.executed_at
            });
            await doc.save();
            testRunMap[r.test_run_id] = doc._id;
        }

        // 5. Migrate Defects
        console.log('Migrating Defects...');
        const defects = await querySql('SELECT * FROM defects');
        for (const d of defects) {
            const doc = new Defect({
                project_id: projectMap[d.project_id] || fallbackProjectId,
                test_run_id: testRunMap[d.test_run_id] || null,
                test_case_id: testCaseMap[d.test_case_id] || null,
                title: d.title,
                description: d.description,
                steps: d.steps,
                expected_result: d.expected_result,
                actual_result: d.actual_result,
                severity: d.severity,
                priority: d.priority,
                status: d.status,
                detection_source: d.detection_source,
                assignee_id: userMap[d.assignee_id] || null,
                reporter_id: userMap[d.reporter_id] || null,
                created_at: d.created_at
            });
            await doc.save();
        }

        console.log('Migration Complete!');
        process.exit(0);

    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
}

function querySql(query) {
    return new Promise((resolve, reject) => {
        sqlDb.all(query, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

migrateData();
