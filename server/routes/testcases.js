const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get all test types
router.get('/types', (req, res) => {
    db.all('SELECT * FROM test_types', [], (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(rows);
    });
});

// Get test cases (with filters)
router.get('/', (req, res) => {
    const { project_id, module_id } = req.query;
    let sql = `SELECT tc.*, u.name as created_by_name, m.name as module_name, u2.name as assignee_name, p.name as project_name
               FROM test_cases tc
               LEFT JOIN users u ON tc.created_by = u.user_id
               LEFT JOIN users u2 ON tc.assignee_id = u2.user_id
               LEFT JOIN modules m ON tc.module_id = m.module_id
               LEFT JOIN projects p ON tc.project_id = p.project_id
               WHERE 1=1`;
    const params = [];

    if (req.user.role.toLowerCase() !== 'admin') {
        sql += ` AND tc.assignee_id = ?`;
        params.push(req.user.userId);
    }
    if (project_id) {
        sql += ` AND tc.project_id = ?`;
        params.push(project_id);
    }
    if (module_id) {
        sql += ` AND tc.module_id = ?`;
        params.push(module_id);
    }
    if (req.query.search) {
        sql += ` AND (tc.title LIKE ? OR tc.description LIKE ?)`;
        params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    sql += ` ORDER BY tc.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });

        // Fetch test types for each test case (N+1 problem but okay for small scale)
        const promises = rows.map(row => {
            return new Promise((resolve) => {
                db.all(`SELECT tt.name FROM test_types tt 
                        JOIN test_case_types tct ON tt.test_type_id = tct.test_type_id 
                        WHERE tct.test_case_id = ?`, [row.test_case_id], (err, types) => {
                    row.test_types = types ? types.map(t => t.name) : [];
                    resolve(row);
                });
            });
        });

        Promise.all(promises).then(completedRows => res.json(completedRows));
    });
});

// Create test case
router.post('/', (req, res) => {
    const { project_id, module_id, title, description, preconditions, steps, expected_result, priority, test_types, assignee_id } = req.body;

    if (!project_id || !title) return res.status(400).json({ message: 'Project and Title are required' });

    const sql = `INSERT INTO test_cases (project_id, module_id, title, description, preconditions, steps, expected_result, priority, created_by, assignee_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [project_id, module_id, title, description, preconditions, steps, expected_result, priority, req.user.userId, assignee_id || null], function (err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });

        const testCaseId = this.lastID;

        // Insert test types
        if (test_types && Array.isArray(test_types) && test_types.length > 0) {
            const placeholders = test_types.map(() => '(?, ?)').join(',');
            const values = [];
            test_types.forEach(typeId => {
                values.push(testCaseId, typeId);
            });

            db.run(`INSERT INTO test_case_types (test_case_id, test_type_id) VALUES ${placeholders}`, values, (err) => {
                if (err) console.error('Error inserting test types', err);
            });
        }

        res.status(201).json({ message: 'Test case created', testCaseId });
    });
});

// Update test case
router.put('/:id', (req, res) => {
    const { title, description, preconditions, steps, expected_result, priority, status, test_types, assignee_id } = req.body;
    const testCaseId = req.params.id;

    const sql = `UPDATE test_cases SET title = ?, description = ?, preconditions = ?, steps = ?, expected_result = ?, priority = ?, status = ?, assignee_id = ? WHERE test_case_id = ?`;

    db.run(sql, [title, description, preconditions, steps, expected_result, priority, status, assignee_id || null, testCaseId], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });

        // Update types: Delete all and re-insert
        if (test_types && Array.isArray(test_types)) {
            db.run(`DELETE FROM test_case_types WHERE test_case_id = ?`, [testCaseId], (err) => {
                if (!err && test_types.length > 0) {
                    const placeholders = test_types.map(() => '(?, ?)').join(',');
                    const values = [];
                    test_types.forEach(typeId => {
                        values.push(testCaseId, typeId);
                    });
                    db.run(`INSERT INTO test_case_types (test_case_id, test_type_id) VALUES ${placeholders}`, values);
                }
            });
        }

        res.json({ message: 'Test case updated' });
    });
});

// Delete test case
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM test_cases WHERE test_case_id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Test case deleted' });
    });
});

module.exports = router;
