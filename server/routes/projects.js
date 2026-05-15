const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get all projects
router.get('/', (req, res) => {
    let sql = `SELECT p.*, u1.name as created_by_name, u2.name as assignee_name 
                 FROM projects p 
                 LEFT JOIN users u1 ON p.created_by = u1.user_id 
                 LEFT JOIN users u2 ON p.assignee_id = u2.user_id`;
    
    const params = [];
    if (req.user.role.toLowerCase() !== 'admin') {
        sql += ` WHERE p.assignee_id = ?`;
        params.push(req.user.userId);
    }
    
    sql += ` ORDER BY p.created_at DESC`;
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        res.json(rows);
    });
});

// Create a project
router.post('/', (req, res) => {
    const { name, description, assignee_id } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const sql = `INSERT INTO projects (name, description, created_by, assignee_id) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, description, req.user.userId, assignee_id || null], function (err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        res.status(201).json({ message: 'Project created', projectId: this.lastID });
    });
});

// Update a project
router.put('/:id', (req, res) => {
    const { name, description, assignee_id } = req.body;
    const projectId = req.params.id;

    const sql = `UPDATE projects SET name = ?, description = ?, assignee_id = ? WHERE project_id = ?`;
    db.run(sql, [name, description, assignee_id || null, projectId], function (err) {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project updated successfully' });
    });
});

// Get project details with modules
router.get('/:id', (req, res) => {
    const projectId = req.params.id;
    const projectSql = `SELECT * FROM projects WHERE project_id = ?`;
    const modulesSql = `SELECT * FROM modules WHERE project_id = ?`;

    db.get(projectSql, [projectId], (err, project) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        db.all(modulesSql, [projectId], (err, modules) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            res.json({ ...project, modules });
        });
    });
});

// Delete project
router.delete('/:id', (req, res) => {
    // Only Admin or QA Lead (or creator) should delete? For now, let's say Admin or QA Lead.
    if (req.user.role === 'Tester') return res.status(403).json({ message: 'Access denied' });

    const sql = `DELETE FROM projects WHERE project_id = ?`;
    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: 'Project deleted' });
    });
});

// Add module to project
router.post('/:id/modules', (req, res) => {
    const projectId = req.params.id;
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ message: 'Module name is required' });

    const sql = `INSERT INTO modules (project_id, name, description) VALUES (?, ?, ?)`;
    db.run(sql, [projectId, name, description], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: 'Module added', moduleId: this.lastID });
    });
});

module.exports = router;
