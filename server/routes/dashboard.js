const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        // Basic Counts
        stats.totalProjects = (await getAsync('SELECT COUNT(*) as count FROM projects')).count;
        stats.totalTestCases = (await getAsync('SELECT COUNT(*) as count FROM test_cases')).count;
        stats.totalRuns = (await getAsync('SELECT COUNT(*) as count FROM test_runs')).count;
        stats.totalDefects = (await getAsync('SELECT COUNT(*) as count FROM defects')).count;
        stats.openDefects = (await getAsync("SELECT COUNT(*) as count FROM defects WHERE status != 'Closed'")).count;

        // Chart Data: Defects by Severity
        stats.defectsBySeverity = await getAllAsync(`
            SELECT severity as name, COUNT(*) as value 
            FROM defects 
            GROUP BY severity
        `);

        // Chart Data: Test Cases by Priority
        stats.testCasesByPriority = await getAllAsync(`
            SELECT priority as name, COUNT(*) as value 
            FROM test_cases 
            GROUP BY priority
        `);

        // Chart Data: Recent Activity (Last 5 Test Runs)
        stats.recentRuns = await getAllAsync(`
            SELECT tr.name, p.name as project_name, tr.executed_at as created_at 
            FROM test_runs tr
            JOIN projects p ON tr.project_id = p.project_id
            ORDER BY tr.executed_at DESC LIMIT 5
        `);

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function getAllAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = router;
