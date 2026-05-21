const express = require('express');
const AITestCase = require('../models/AITestCase');
const aiTestGenerator = require('../utils/aiTestGenerator');

const router = express.Router();

router.post('/generate-from-requirement', async (req, res) => {
    const { project_id, requirement } = req.body;

    if (!requirement) return res.status(400).json({ error: 'Requirement text is required' });

    try {
        const result = await aiTestGenerator.generateFromRequirement(requirement);

        const newCase = new AITestCase({
            project_id: project_id || null,
            source_type: 'requirement',
            source_content: requirement,
            generated_cases: JSON.stringify(result.testCases),
            confidence_score: result.confidence
        });

        await newCase.save();

        res.json({
            ai_test_id: newCase._id,
            ...result
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ error: 'Failed to generate test cases' });
    }
});

router.post('/generate-from-story', async (req, res) => {
    const { project_id, user_story } = req.body;

    if (!user_story) return res.status(400).json({ error: 'User story is required' });

    try {
        const result = await aiTestGenerator.generateFromUserStory(user_story);

        const newCase = new AITestCase({
            project_id: project_id || null,
            source_type: 'user_story',
            source_content: user_story,
            generated_cases: JSON.stringify(result.testCases),
            confidence_score: result.confidence
        });

        await newCase.save();

        res.json({
            ai_test_id: newCase._id,
            ...result
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ error: 'Failed to generate test cases' });
    }
});

router.post('/generate-from-code', async (req, res) => {
    const { project_id, code, language } = req.body;

    if (!code) return res.status(400).json({ error: 'Code is required' });

    try {
        const result = await aiTestGenerator.generateFromCode(code, language || 'javascript');

        const newCase = new AITestCase({
            project_id: project_id || null,
            source_type: 'code',
            source_content: code,
            generated_cases: JSON.stringify(result.testCases),
            confidence_score: result.confidence
        });

        await newCase.save();

        res.json({
            ai_test_id: newCase._id,
            ...result
        });
    } catch (error) {
        console.error('Error generating test cases:', error);
        res.status(500).json({ error: 'Failed to generate test cases' });
    }
});

router.get('/project/:projectId', async (req, res) => {
    try {
        const cases = await AITestCase.find({ project_id: req.params.projectId })
            .sort({ created_at: -1 })
            .lean();

        const results = cases.map(row => ({
            ...row,
            ai_test_id: row._id,
            generated_cases: JSON.parse(row.generated_cases)
        }));

        res.json(results);
    } catch (error) {
        console.error('Error fetching AI test cases:', error);
        res.status(500).json({ error: 'Failed to fetch test cases' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const row = await AITestCase.findById(req.params.id).lean();

        if (!row) return res.status(404).json({ error: 'AI test generation not found' });

        res.json({
            ...row,
            ai_test_id: row._id,
            generated_cases: JSON.parse(row.generated_cases)
        });
    } catch (error) {
        console.error('Error fetching AI test case:', error);
        res.status(500).json({ error: 'Failed to fetch test case' });
    }
});

// Import endpoints mapped to TestCase schema would be here, but we simplify to just deleting
router.delete('/:id', async (req, res) => {
    try {
        const result = await AITestCase.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'AI test case not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting AI test case:', error);
        res.status(500).json({ error: 'Failed to delete test case' });
    }
});

module.exports = router;
