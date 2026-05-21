const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Mongoose Models
const User = require('./models/User');
const Project = require('./models/Project');
const TestCase = require('./models/TestCase');
const TestRun = require('./models/TestRun');
const Defect = require('./models/Defect');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/meghana_qa';
const SQLITE_DB_PATH = path.join(__dirname, 'qa_tool.sqlite');

const migrateData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB.');

        console.log('Dropping existing database collections to ensure clean migration...');
        await mongoose.connection.db.dropDatabase();

        console.log('Connecting to SQLite...');
        const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
            if (err) throw err;
            console.log('Connected to SQLite.');
        });

        // Helper function to query SQLite
        const queryAll = (query) => {
            return new Promise((resolve, reject) => {
                db.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        // 1. Migrate Users
        console.log('Migrating Users...');
        const users = await queryAll('SELECT * FROM users');
        const userMap = {}; // Maps sqlite user_id to mongo _id
        for (const u of users) {
            const newUser = new User({
                name: u.name,
                email: u.email,
                password: u.password_hash,
                role: u.role ? u.role.toLowerCase() : 'tester',
                created_at: u.created_at
            });
            await newUser.save();
            userMap[u.user_id] = newUser._id;
        }
        console.log(`Migrated ${users.length} users.`);

        // 2. Migrate Projects
        console.log('Migrating Projects...');
        const projects = await queryAll('SELECT * FROM projects');
        const projectMap = {};
        for (const p of projects) {
            const newProject = new Project({
                name: p.name,
                description: p.description,
                status: p.status,
                created_by: userMap[p.created_by] || null,
                created_at: p.created_at
            });
            await newProject.save();
            projectMap[p.project_id] = newProject._id;
        }
        console.log(`Migrated ${projects.length} projects.`);

        // 3. Migrate Test Cases
        console.log('Migrating Test Cases...');
        const testCases = await queryAll('SELECT * FROM test_cases');
        for (const tc of testCases) {
            const newTestCase = new TestCase({
                project_id: projectMap[tc.project_id] || null,
                title: tc.title,
                description: tc.description,
                steps: tc.steps,
                expected_result: tc.expected_result,
                priority: tc.priority,
                status: tc.status,
                created_by: userMap[tc.created_by] || null,
                created_at: tc.created_at
            });
            await newTestCase.save();
        }
        console.log(`Migrated ${testCases.length} test cases.`);

        console.log('Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateData();
