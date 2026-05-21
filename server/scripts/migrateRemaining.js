const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Mongoose Models
const User = require('../models/User');
const Project = require('../models/Project');
const Requirement = require('../models/Requirement');
const Setting = require('../models/Setting');
const Attachment = require('../models/Attachment');
const ApiCollection = require('../models/ApiCollection');
const ApiMonitor = require('../models/ApiMonitor');
const VisualProject = require('../models/VisualProject');
const VisualRun = require('../models/VisualRun');
const SecurityScan = require('../models/SecurityScan');
const { SeleniumScript, SeleniumJob } = require('../models/Selenium');
const WebMonitorJob = require('../models/WebMonitorJob');
const AITestCase = require('../models/AITestCase');

const dbPath = path.join(__dirname, '../qa_tool.sqlite');
const sqlDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) console.error('Could not connect to SQLite:', err.message);
    else console.log('Connected to SQLite database.');
});

// Save with retry on connection error
async function saveWithRetry(doc, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await doc.save();
            return;
        } catch (err) {
            if ((err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') && i < retries - 1) {
                console.log(`  ⚠️  Connection lost, reconnecting (attempt ${i + 1})...`);
                await new Promise(r => setTimeout(r, 3000));
                try {
                    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
                } catch(e) { /* ignore */ }
            } else {
                throw err;
            }
        }
    }
}

async function migrateData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 60000,
        });
        console.log('Connected to MongoDB.');

        // Clear existing remaining collections
        console.log('Clearing old data...');
        await Requirement.deleteMany({});
        await Setting.deleteMany({});
        await Attachment.deleteMany({});
        await ApiCollection.deleteMany({});
        await ApiMonitor.deleteMany({});
        await VisualProject.deleteMany({});
        await VisualRun.deleteMany({});
        await SecurityScan.deleteMany({});
        await SeleniumScript.deleteMany({});
        await SeleniumJob.deleteMany({});
        await WebMonitorJob.deleteMany({});
        await AITestCase.deleteMany({});

        // --- Build Lookup Maps ---
        console.log('Building mapping dictionaries...');
        
        const sqliteUsers = await querySql('SELECT * FROM users');
        const mongoUsers = await User.find().lean();
        const userMap = {};
        for (const su of sqliteUsers) {
            const mu = mongoUsers.find(u => u.email === su.email);
            if (mu) userMap[su.user_id] = mu._id;
        }
        const fallbackUserId = Object.values(userMap)[0] || null;

        const sqliteProjects = await querySql('SELECT * FROM projects');
        const mongoProjects = await Project.find().lean();
        const projectMap = {};
        for (const sp of sqliteProjects) {
            const mp = mongoProjects.find(p => p.name === sp.name);
            if (mp) projectMap[sp.project_id] = mp._id;
        }
        const fallbackProjectId = Object.values(projectMap)[0] || null;

        // 1. Requirements
        console.log('Migrating Requirements...');
        const reqs = await querySql('SELECT * FROM requirements');
        for (const r of reqs) {
            await saveWithRetry(new Requirement({
                project_id: projectMap[r.project_id] || fallbackProjectId,
                req_identifier: r.req_identifier || `REQ-${r.requirement_id}`,
                title: r.title || 'Untitled',
                description: r.description,
                status: r.status,
                priority: r.priority,
                created_by: userMap[r.created_by] || fallbackUserId,
                created_at: r.created_at
            }));
        }
        console.log(`  ✅ ${reqs.length} requirements migrated`);

        // 2. Settings
        console.log('Migrating Settings...');
        const settings = await querySql('SELECT * FROM settings');
        for (const s of settings) {
            await saveWithRetry(new Setting({
                user_id: userMap[s.user_id] || fallbackUserId,
                coverage_threshold: s.coverage_threshold,
                complexity_threshold: s.complexity_threshold,
                security_strictness: s.security_strictness,
                notifications_enabled: !!s.notifications_enabled,
                rtm_strictness: s.rtm_strictness
            }));
        }
        console.log(`  ✅ ${settings.length} settings migrated`);

        // 3. Attachments
        console.log('Migrating Attachments...');
        const attachments = await querySql('SELECT * FROM attachments');
        for (const a of attachments) {
            await saveWithRetry(new Attachment({
                entity_type: a.entity_type,
                entity_id: new mongoose.Types.ObjectId(),
                file_path: a.file_path,
                uploaded_at: a.uploaded_at
            }));
        }
        console.log(`  ✅ ${attachments.length} attachments migrated`);

        // 4. API Collections & Requests (batched)
        console.log('Migrating API Collections...');
        const apiCols = await querySql('SELECT * FROM api_collections');
        const colMap = {};
        let colCount = 0;
        for (const c of apiCols) {
            const doc = new ApiCollection({
                project_id: projectMap[c.project_id] || fallbackProjectId,
                name: c.name || `Collection ${c.collection_id}`,
                description: c.description,
                created_at: c.created_at,
                requests: []
            });
            
            const requests = await querySql(`SELECT * FROM api_requests WHERE collection_id = ${c.collection_id}`);
            for (const req of requests) {
                const results = await querySql(`SELECT * FROM api_test_results WHERE request_id = ${req.request_id} LIMIT 20`);
                doc.requests.push({
                    name: req.name || req.url,
                    method: req.method,
                    url: req.url,
                    headers: req.headers,
                    body: req.body,
                    expected_status: req.expected_status,
                    results: results.map(res => ({
                        status_code: res.status_code,
                        response_time: res.response_time_ms,
                        response_body: res.response_body ? res.response_body.substring(0, 500) : null,
                        passed: res.success === 1
                    }))
                });
            }
            await saveWithRetry(doc);
            colMap[c.collection_id] = doc._id;
            colCount++;
            if (colCount % 10 === 0) console.log(`  ... ${colCount}/${apiCols.length} collections done`);
        }
        console.log(`  ✅ ${apiCols.length} API collections migrated`);

        // 5. API Monitors
        console.log('Migrating API Monitors...');
        const monitors = await querySql('SELECT * FROM api_monitors');
        for (const m of monitors) {
            await saveWithRetry(new ApiMonitor({
                name: m.name || `Monitor ${m.monitor_id}`,
                collection_id: colMap[m.collection_id] || null,
                frequency_cron: m.frequency_cron || '*/5 * * * *',
                emails: m.emails,
                is_active: m.is_active === 1,
                last_run: m.last_run
            }));
        }
        console.log(`  ✅ ${monitors.length} API monitors migrated`);

        // 6. Visual Projects & Runs
        console.log('Migrating Visual Testing...');
        const visProjs = await querySql('SELECT * FROM visual_projects');
        const visProjMap = {};
        for (const vp of visProjs) {
            const doc = new VisualProject({
                project_id: projectMap[vp.project_id] || fallbackProjectId,
                name: vp.name || `Visual Project ${vp.project_id}`,
                description: vp.description,
                base_url: vp.base_url || 'http://localhost',
                created_at: vp.created_at
            });
            await saveWithRetry(doc);
            visProjMap[vp.project_id] = doc._id;
        }

        const visRuns = await querySql('SELECT * FROM visual_runs');
        const fallbackVisProjId = Object.values(visProjMap)[0] || new mongoose.Types.ObjectId();
        for (const vr of visRuns) {
            await saveWithRetry(new VisualRun({
                visual_project_id: visProjMap[vr.project_id] || fallbackVisProjId,
                run_type: 'baseline',
                status: vr.status ? vr.status.toLowerCase() : 'completed',
                passed: vr.passed_tests || 0,
                failed: vr.failed_tests || 0,
                started_at: vr.started_at,
                completed_at: vr.completed_at
            }));
        }
        console.log(`  ✅ ${visProjs.length} visual projects, ${visRuns.length} runs migrated`);

        // 7. Security Scans
        console.log('Migrating Security Scans...');
        const scans = await querySql('SELECT * FROM security_scans');
        for (const s of scans) {
            await saveWithRetry(new SecurityScan({
                target_url: s.target_url || 'http://localhost',
                status: s.status,
                high_vulns: s.high_vulns || 0,
                medium_vulns: s.medium_vulns || 0,
                low_vulns: s.low_vulns || 0,
                scan_date: s.scan_date,
                findings: []
            }));
        }
        console.log(`  ✅ ${scans.length} security scans migrated`);

        // 8. Selenium
        console.log('Migrating Selenium Scripts & Jobs...');
        const selScripts = await querySql('SELECT * FROM selenium_scripts');
        const selMap = {};
        for (const ss of selScripts) {
            const doc = new SeleniumScript({
                name: ss.name || `Script ${ss.script_id}`,
                description: ss.description,
                file_path: ss.file_path,
                uploaded_by: userMap[ss.uploaded_by] || fallbackUserId,
                uploaded_at: ss.uploaded_at
            });
            await saveWithRetry(doc);
            selMap[ss.script_id] = doc._id;
        }

        const selJobs = await querySql('SELECT * FROM selenium_job_runs');
        for (const sj of selJobs) {
            const exes = await querySql(`SELECT * FROM selenium_browser_executions WHERE job_id = ${sj.job_id}`);
            await saveWithRetry(new SeleniumJob({
                script_id: selMap[sj.script_id] || Object.values(selMap)[0] || new mongoose.Types.ObjectId(),
                user_id: userMap[sj.user_id] || fallbackUserId,
                status: sj.status,
                created_at: sj.created_at,
                executions: exes.map(e => ({
                    browser: e.browser,
                    status: e.status,
                    start_time: e.start_time,
                    end_time: e.end_time,
                    log_output: e.logs_path || e.error_message,
                    video_path: e.video_path
                }))
            }));
        }
        console.log(`  ✅ ${selScripts.length} selenium scripts, ${selJobs.length} jobs migrated`);

        // 9. Web Monitor Jobs
        console.log('Migrating Web Monitor Jobs...');
        const webMonitors = await querySql('SELECT * FROM monitoring_jobs');
        for (const wm of webMonitors) {
            const links = await querySql(`SELECT * FROM link_validation_results WHERE job_id = ${wm.job_id} LIMIT 100`);
            await saveWithRetry(new WebMonitorJob({
                url: wm.url,
                status: wm.status,
                total_links: wm.total_links || 0,
                broken_links: wm.broken_links || 0,
                seo_score: wm.health_score || 0,
                created_at: wm.created_at,
                completed_at: wm.updated_at,
                links: links.map(l => ({
                    link_url: l.url,
                    status_code: l.status_code,
                    status: l.status
                }))
            }));
        }
        console.log(`  ✅ ${webMonitors.length} web monitor jobs migrated`);

        // 10. AI Test Cases
        console.log('Migrating AI Test Cases...');
        const aiCases = await querySql('SELECT * FROM ai_test_cases');
        for (const ai of aiCases) {
            await saveWithRetry(new AITestCase({
                project_id: projectMap[ai.project_id] || fallbackProjectId,
                source_type: ai.source_type || 'user_story',
                source_content: ai.prompt || ai.source_content || 'N/A',
                generated_cases: ai.generated_tests || ai.generated_cases || '[]',
                confidence_score: ai.confidence_score || 0,
                created_at: ai.created_at
            }));
        }
        console.log(`  ✅ ${aiCases.length} AI test cases migrated`);

        console.log('\n🎉 Full Migration Complete! All data is now in MongoDB.');
        process.exit(0);

    } catch (err) {
        console.error('Migration Error:', err.message || err);
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
