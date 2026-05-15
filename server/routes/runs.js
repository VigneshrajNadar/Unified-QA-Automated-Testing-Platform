const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// --- Test Suites ---

// Create Test Suite
router.post('/suites', (req, res) => {
    const { project_id, name, description, test_case_ids } = req.body;

    if (!project_id || !name) return res.status(400).json({ message: 'Project and Name are required' });

    db.run(`INSERT INTO test_suites (project_id, name, description) VALUES (?, ?, ?)`,
        [project_id, name, description], function (err) {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });

            const suiteId = this.lastID;

            if (test_case_ids && Array.isArray(test_case_ids) && test_case_ids.length > 0) {
                const placeholders = test_case_ids.map(() => '(?, ?)').join(',');
                const values = [];
                test_case_ids.forEach(tcId => values.push(suiteId, tcId));

                db.run(`INSERT INTO test_suite_cases (test_suite_id, test_case_id) VALUES ${placeholders}`, values);
            }

            res.status(201).json({ message: 'Test Suite created', suiteId });
        });
});

// Get Suites by Project
router.get('/suites', (req, res) => {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ message: 'Project ID is required' });

    db.all(`SELECT * FROM test_suites WHERE project_id = ? ORDER BY test_suite_id DESC`, [project_id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// --- Test Runs ---

// Get Runs (List)
router.get('/', (req, res) => {
    const { project_id } = req.query;
    let sql = `SELECT tr.*, ts.name as suite_name, u.name as executed_by_name 
               FROM test_runs tr 
               JOIN test_suites ts ON tr.test_suite_id = ts.test_suite_id
               LEFT JOIN users u ON tr.executed_by = u.user_id
               WHERE 1=1`;
    const params = [];

    if (project_id) {
        sql += ` AND tr.project_id = ?`;
        params.push(project_id);
    }

    sql += ` ORDER BY tr.test_run_id DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Create Test Run
router.post('/', (req, res) => {
    const { project_id, test_suite_id, name } = req.body;

    if (!project_id || !test_suite_id || !name) return res.status(400).json({ message: 'Required fields missing' });

    db.run(`INSERT INTO test_runs (project_id, test_suite_id, name, executed_by) VALUES (?, ?, ?, ?)`,
        [project_id, test_suite_id, name, req.user.userId], function (err) {
            if (err) return res.status(500).json({ message: 'Database error', error: err.message });

            const runId = this.lastID;

            // Initialize results for all cases in the suite
            db.all(`SELECT test_case_id FROM test_suite_cases WHERE test_suite_id = ?`, [test_suite_id], (err, cases) => {
                if (cases && cases.length > 0) {
                    const placeholders = cases.map(() => '(?, ?, ?)').join(',');
                    const values = [];
                    cases.forEach(c => values.push(runId, c.test_case_id, 'Not Run'));

                    db.run(`INSERT INTO test_run_results (test_run_id, test_case_id, status) VALUES ${placeholders}`, values);
                }
            });

            res.status(201).json({ message: 'Test Run created', runId });
        });
});

// Get Run Details (with results)
router.get('/:id', (req, res) => {
    const runId = req.params.id;

    db.get(`SELECT tr.*, ts.name as suite_name, u.name as executed_by_name 
            FROM test_runs tr 
            JOIN test_suites ts ON tr.test_suite_id = ts.test_suite_id
            LEFT JOIN users u ON tr.executed_by = u.user_id
            WHERE tr.test_run_id = ?`, [runId], (err, run) => {
        if (err || !run) return res.status(404).json({ message: 'Run not found' });

        db.all(`SELECT trr.*, tc.title, tc.priority 
                FROM test_run_results trr 
                JOIN test_cases tc ON trr.test_case_id = tc.test_case_id 
                WHERE trr.test_run_id = ?`, [runId], (err, results) => {
            res.json({ ...run, results });
        });
    });
});

// Update Result (Execute)
router.post('/:id/results', (req, res) => {
    const runId = req.params.id;
    const { test_case_id, status, actual_result, comments } = req.body;

    db.run(`UPDATE test_run_results SET status = ?, actual_result = ?, comments = ? 
            WHERE test_run_id = ? AND test_case_id = ?`,
        [status, actual_result, comments, runId, test_case_id], function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ message: 'Result updated' });
        });
});

// Get static issues for a run
router.get('/:id/static-issues', (req, res) => {
    db.all('SELECT * FROM static_issues WHERE run_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows || []);
    });
});

// Get security issues for a run
router.get('/:id/security-issues', (req, res) => {
    db.all('SELECT * FROM security_issues WHERE run_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows || []);
    });
});



// Get complexity metrics for a run
router.get('/:id/complexity-metrics', (req, res) => {
    db.all('SELECT * FROM complexity_metrics WHERE run_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows || []);
    });
});

// Get coverage summary for a run
router.get('/:id/coverage-summary', (req, res) => {
    db.get('SELECT * FROM coverage_summary WHERE run_id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(row || null);
    });
});

// Get test type results for a run
router.get('/:id/test-type-results', (req, res) => {
    db.all('SELECT * FROM test_type_results WHERE run_id = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows || []);
    });
});

// Compare two runs
router.get('/compare/:runId1/:runId2', async (req, res) => {
    const { runId1, runId2 } = req.params;

    try {
        const getDefects = (runId) => new Promise((resolve, reject) => {
            db.all('SELECT * FROM defects WHERE test_run_id = ?', [runId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const [defects1, defects2] = await Promise.all([getDefects(runId1), getDefects(runId2)]);

        // Identify new defects (in run2 but not run1)
        // Matching by title for simplicity, ideally should use a unique signature
        const newDefects = defects2.filter(d2 => !defects1.some(d1 => d1.title === d2.title));

        // Identify fixed defects (in run1 but not run2)
        const fixedDefects = defects1.filter(d1 => !defects2.some(d2 => d2.title === d1.title));

        // Identify persistent defects
        const persistentDefects = defects2.filter(d2 => defects1.some(d1 => d1.title === d2.title));

        res.json({
            runId1,
            runId2,
            newDefects,
            fixedDefects,
            persistentDefects
        });
    } catch (err) {
        res.status(500).json({ message: 'Comparison failed', error: err.message });
    }
});

module.exports = router;
