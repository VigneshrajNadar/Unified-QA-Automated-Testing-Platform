const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. GET ALL (With RTM & Hierarchy Info)
router.get('/', (req, res) => {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ message: 'Project ID required' });

    db.all(`SELECT * FROM requirements WHERE project_id = ? ORDER BY created_at DESC`, [project_id], (err, reqs) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        // Populate Test Cases (RTM Logic)
        const promises = reqs.map(r => new Promise(resolve => {
            db.all(`SELECT tc.test_case_id, tc.title, 
                    (SELECT status FROM test_run_results trr WHERE trr.test_case_id = tc.test_case_id ORDER BY trr.result_id DESC LIMIT 1) as last_run_status
                    FROM test_cases tc 
                    JOIN requirement_test_cases rtc ON tc.test_case_id = rtc.test_case_id 
                    WHERE rtc.requirement_id = ?`, [r.requirement_id], (err, cases) => {
                r.test_cases = cases || [];
                resolve(r);
            });
        }));

        Promise.all(promises).then(results => res.json(results));
    });
});

// 2. CREATE (With Hierarchy)
router.post('/', (req, res) => {
    const { project_id, req_identifier, title, description, type, priority, version, parent_id, category, urgency, business_value } = req.body;

    db.get(`SELECT requirement_id FROM requirements WHERE project_id = ? AND req_identifier = ?`, [project_id, req_identifier], (err, row) => {
        if (row) return res.status(400).json({ message: 'Requirement ID already exists' });

        db.run(`INSERT INTO requirements (project_id, req_identifier, title, description, type, priority, version, status, parent_id, category, urgency, business_value) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', ?, ?, ?, ?)`,
            [project_id, req_identifier, title, description, type, priority, version || '1.0', parent_id || null, category || 'Story', urgency || 'Medium', business_value || 0],
            function (err) {
                if (err) return res.status(500).json({ message: err.message });
                res.status(201).json({ message: 'Requirement created', requirementId: this.lastID });
            });
    });
});

// 3. UPDATE (With Verification History)
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status, type, urgency, business_value, change_reason, user_id } = req.body;

    // First, fetch current state to save to history
    db.get(`SELECT * FROM requirements WHERE requirement_id = ?`, [id], (err, current) => {
        if (!current) return res.status(404).json({ message: 'Not found' });

        // Save Version Snapshot
        db.run(`INSERT INTO requirement_versions (requirement_id, version_number, title, description, changed_by, change_reason)
                VALUES (?, ?, ?, ?, ?, ?)`,
            [id, current.version ? parseFloat(current.version) : 1.0, current.title, current.description, user_id || 1, change_reason || 'Update'],
            (err) => {
                if (err) console.error("Failed to save version history", err);

                // Increment Version (e.g., 1.0 -> 1.1)
                const newVersion = (parseFloat(current.version || '1.0') + 0.1).toFixed(1);

                // Update Requirement
                db.run(`UPDATE requirements SET title = ?, description = ?, priority = ?, status = ?, type = ?, urgency = ?, business_value = ?, version = ? WHERE requirement_id = ?`,
                    [title, description, priority, status, type, urgency, business_value, newVersion, id],
                    function (err) {
                        if (err) return res.status(500).json({ message: 'Update failed' });
                        res.json({ message: 'Requirement updated and versioned', newVersion });
                    }
                );
            }
        );
    });
});

// 4. GET HISTORY
router.get('/:id/versions', (req, res) => {
    db.all(`SELECT * FROM requirement_versions WHERE requirement_id = ? ORDER BY changed_at DESC`, [req.params.id], (err, rows) => {
        res.json(rows || []);
    });
});

// 5. COMMENTS API
router.get('/:id/comments', (req, res) => {
    db.all(`SELECT rc.*, u.name as user_name FROM requirement_comments rc 
            LEFT JOIN users u ON rc.user_id = u.user_id
            WHERE requirement_id = ? ORDER BY rc.created_at DESC`, [req.params.id], (err, rows) => {
        res.json(rows || []);
    });
});

router.post('/:id/comments', (req, res) => {
    const { user_id, comment_text } = req.body;
    db.run(`INSERT INTO requirement_comments (requirement_id, user_id, comment_text) VALUES (?, ?, ?)`,
        [req.params.id, user_id, comment_text], function (err) {
            if (err) return res.status(500).json({ message: 'Failed to post comment' });
            res.json({ message: 'Comment added', commentId: this.lastID });
        });
});

// LINK Test Case (Existing)
router.post('/link', (req, res) => {
    const { requirement_id, test_case_id } = req.body;
    db.run(`INSERT OR IGNORE INTO requirement_test_cases (requirement_id, test_case_id) VALUES (?, ?)`,
        [requirement_id, test_case_id], function (err) {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ message: 'Linked successfully' });
        });
});

module.exports = router;
