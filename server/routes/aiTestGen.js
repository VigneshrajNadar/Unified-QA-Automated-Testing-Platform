const express = require('express');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');
const aiTestGenerator = require('../utils/aiTestGenerator');

const router = express.Router();

// Generate test cases from requirement
router.post('/generate-from-requirement', async (req, res) => {
    const { project_id, requirement } = req.body;

    if (!requirement) {
        return res.status(400).json({ error: 'Requirement text is required' });
    }

    try {
        const result = await aiTestGenerator.generateFromRequirement(requirement);

        // Save to database
        const sql = `INSERT INTO ai_test_cases (project_id, source_type, source_content, generated_cases, confidence_score) 
                     VALUES (?, ?, ?, ?, ?)`;

        db.run(sql, [
            project_id || null,
            'requirement',
            requirement,
            JSON.stringify(result.testCases),
            result.confidence
        ], function (err) {
            if (err) {
                console.error('Error saving AI test cases:', err);
                return res.status(500).json({ error: 'Failed to save test cases' });
            }

            res.json({
                ai_test_id: this.lastID,
                ...result
            });
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ error: 'Failed to generate test cases' });
    }
});

// Generate test cases from user story
router.post('/generate-from-story', async (req, res) => {
    const { project_id, user_story } = req.body;

    if (!user_story) {
        return res.status(400).json({ error: 'User story is required' });
    }

    try {
        const result = await aiTestGenerator.generateFromUserStory(user_story);

        // Save to database
        const sql = `INSERT INTO ai_test_cases (project_id, source_type, source_content, generated_cases, confidence_score) 
                     VALUES (?, ?, ?, ?, ?)`;

        db.run(sql, [
            project_id || null,
            'user_story',
            user_story,
            JSON.stringify(result.testCases),
            result.confidence
        ], function (err) {
            if (err) {
                console.error('Error saving AI test cases:', err);
                return res.status(500).json({ error: 'Failed to save test cases' });
            }

            res.json({
                ai_test_id: this.lastID,
                ...result
            });
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ error: 'Failed to generate test cases' });
    }
});

// Generate test cases from code
router.post('/generate-from-code', async (req, res) => {
    const { project_id, code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        const result = await aiTestGenerator.generateFromCode(code, language || 'javascript');

        // Save to database
        const sql = `INSERT INTO ai_test_cases (project_id, source_type, source_content, generated_cases, confidence_score) 
                     VALUES (?, ?, ?, ?, ?)`;

        db.run(sql, [
            project_id || null,
            'code',
            code,
            JSON.stringify(result.testCases),
            result.confidence
        ], function (err) {
            if (err) {
                console.error('Error saving AI test cases:', err);
                return res.status(500).json({ error: 'Failed to save test cases' });
            }

            res.json({
                ai_test_id: this.lastID,
                ...result
            });
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ error: 'Failed to generate test cases' });
    }
});

// Get all AI generated test cases for a project
router.get('/project/:projectId', (req, res) => {
    const { projectId } = req.params;

    const sql = `SELECT * FROM ai_test_cases WHERE project_id = ? ORDER BY created_at DESC`;

    db.all(sql, [projectId], (err, rows) => {
        if (err) {
            console.error('Error fetching AI test cases:', err);
            return res.status(500).json({ error: 'Failed to fetch test cases' });
        }

        // Parse generated_cases JSON
        const results = rows.map(row => ({
            ...row,
            generated_cases: JSON.parse(row.generated_cases)
        }));

        res.json(results);
    });
});

// Get a specific AI test case generation
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const sql = `SELECT * FROM ai_test_cases WHERE ai_test_id = ?`;

    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error('Error fetching AI test case:', err);
            return res.status(500).json({ error: 'Failed to fetch test case' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Test case not found' });
        }

        res.json({
            ...row,
            generated_cases: JSON.parse(row.generated_cases)
        });
    });
});

// Delete AI test case generation
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const sql = `DELETE FROM ai_test_cases WHERE ai_test_id = ?`;

    db.run(sql, [id], function (err) {
        if (err) {
            console.error('Error deleting AI test case:', err);
            return res.status(500).json({ error: 'Failed to delete test case' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Test case not found' });
        }

        res.json({ message: 'Test case deleted successfully' });
    });
});

// Export test cases to actual test cases table
router.post('/:id/export', async (req, res) => {
    const { id } = req.params;
    const { selected_cases } = req.body; // Array of test case indices to export

    try {
        // Get AI test cases
        db.get(`SELECT * FROM ai_test_cases WHERE ai_test_id = ?`, [id], (err, row) => {
            if (err || !row) {
                return res.status(404).json({ error: 'Test case not found' });
            }

            const testCases = JSON.parse(row.generated_cases);
            const casesToExport = selected_cases
                ? testCases.filter((_, index) => selected_cases.includes(index))
                : testCases;

            let exported = 0;
            let errors = 0;

            casesToExport.forEach(testCase => {
                const sql = `INSERT INTO test_cases (
                    project_id, title, description, steps, expected_result, 
                    priority, status, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

                const steps = Array.isArray(testCase.steps)
                    ? testCase.steps.join('\n')
                    : testCase.steps || '';

                db.run(sql, [
                    row.project_id,
                    testCase.title,
                    testCase.description,
                    steps,
                    testCase.expectedResult,
                    testCase.priority || 'Medium',
                    'Draft',
                    req.user.user_id
                ], function (err) {
                    if (err) {
                        console.error('Error exporting test case:', err);
                        errors++;
                    } else {
                        exported++;
                    }

                    // Send response after all exports are attempted
                    if (exported + errors === casesToExport.length) {
                        res.json({
                            message: `Exported ${exported} test cases`,
                            exported,
                            errors
                        });
                    }
                });
            });

            if (casesToExport.length === 0) {
                res.json({ message: 'No test cases to export', exported: 0, errors: 0 });
            }
        });
    } catch (error) {
        console.error('Error exporting test cases:', error);
        res.status(500).json({ error: 'Failed to export test cases' });
    }
});

module.exports = router;
