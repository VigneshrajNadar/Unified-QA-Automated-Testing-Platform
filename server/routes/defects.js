const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Create Defect
router.post('/', (req, res) => {
    const {
        project_id,
        test_case_id,
        test_run_id,
        title,
        description,
        severity,
        priority,
        status,
        assignee_id,
        steps,
        expected_result,
        actual_result,
        detection_source
    } = req.body;

    if (!title || !severity || !priority) {
        return res.status(400).json({ message: 'Required fields missing (title, severity, priority)' });
    }

    const sql = `INSERT INTO defects (
        project_id, test_case_id, test_run_id, title, description, 
        severity, priority, status, assignee_id, steps, 
        expected_result, actual_result, detection_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [
        project_id || null,
        test_case_id || null,
        test_run_id || null,
        title,
        description || null,
        severity,
        priority,
        status || 'Open',
        assignee_id || null,
        steps || null,
        expected_result || null,
        actual_result || null,
        detection_source || 'Manual Testing'
    ], function (err) {
        if (err) {
            console.error('Error creating defect:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(201).json({ message: 'Defect created successfully', defectId: this.lastID });
    });
});

// Get All Defects
router.get('/', (req, res) => {
    const { project_id } = req.query;

    let sql = `SELECT d.*, 
               u.name as assignee_name, 
               tc.title as test_case_title,
               p.name as project_name
               FROM defects d 
               LEFT JOIN users u ON d.assignee_id = u.user_id
               LEFT JOIN test_cases tc ON d.test_case_id = tc.test_case_id
               LEFT JOIN projects p ON d.project_id = p.project_id`;

    const params = [];
    const whereClauses = [];

    if (req.user.role.toLowerCase() !== 'admin') {
        whereClauses.push(`d.assignee_id = ?`);
        params.push(req.user.userId);
    }

    if (project_id) {
        whereClauses.push(`d.project_id = ?`);
        params.push(project_id);
    }

    if (whereClauses.length > 0) {
        sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY d.defect_id DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching defects:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.json(rows);
    });
});

// Get Single Defect
router.get('/:id', (req, res) => {
    const defectId = req.params.id;

    const sql = `SELECT d.*, 
                 u.name as assignee_name, 
                 tc.title as test_case_title,
                 p.name as project_name
                 FROM defects d 
                 LEFT JOIN users u ON d.assignee_id = u.user_id
                 LEFT JOIN test_cases tc ON d.test_case_id = tc.test_case_id
                 LEFT JOIN projects p ON d.project_id = p.project_id
                 WHERE d.defect_id = ?`;

    db.get(sql, [defectId], (err, row) => {
        if (err) {
            console.error('Error fetching defect:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Defect not found' });
        }
        res.json(row);
    });
});

// Update Defect
router.put('/:id', (req, res) => {
    const defectId = req.params.id;
    const {
        project_id,
        title,
        description,
        severity,
        priority,
        status,
        assignee_id,
        steps,
        expected_result,
        actual_result,
        detection_source
    } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];

    if (project_id !== undefined) { updates.push('project_id = ?'); values.push(project_id); }
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (severity !== undefined) { updates.push('severity = ?'); values.push(severity); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (assignee_id !== undefined) { updates.push('assignee_id = ?'); values.push(assignee_id); }
    if (steps !== undefined) { updates.push('steps = ?'); values.push(steps); }
    if (expected_result !== undefined) { updates.push('expected_result = ?'); values.push(expected_result); }
    if (actual_result !== undefined) { updates.push('actual_result = ?'); values.push(actual_result); }
    if (detection_source !== undefined) { updates.push('detection_source = ?'); values.push(detection_source); }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(defectId);
    const sql = `UPDATE defects SET ${updates.join(', ')} WHERE defect_id = ?`;

    db.run(sql, values, function (err) {
        if (err) {
            console.error('Error updating defect:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Defect not found' });
        }
        res.json({ message: 'Defect updated successfully' });
    });
});

// Delete Defect
router.delete('/:id', (req, res) => {
    const defectId = req.params.id;

    db.run('DELETE FROM defects WHERE defect_id = ?', [defectId], function (err) {
        if (err) {
            console.error('Error deleting defect:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Defect not found' });
        }
        res.json({ message: 'Defect deleted successfully' });
    });
});

module.exports = router;
