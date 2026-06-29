const express = require('express');
const router = express.Router();
const { callOpenRouter } = require('./ai');
const TestCase = require('../models/TestCase');

router.post('/analyze-diff', async (req, res) => {
    const { diff, project_id } = req.body;

    if (!diff) {
        return res.status(400).json({ error: 'Git Diff is required' });
    }

    try {
        // Fetch existing test cases for context
        const testCases = await TestCase.find({ project_id }).select('title description priority').lean();
        const testCasesList = testCases.map(t => `- [${t._id}] ${t.title} (${t.priority})`).join('\n');

        const prompt = `You are a Smart Test Impact Analyzer (TIA).
Analyze the following code diff and determine which existing test cases are most likely impacted.
Also suggest any new test cases needed.

GIT DIFF:
${diff}

EXISTING TEST CASES (format: [ID] Title (Priority)):
${testCasesList || 'No existing test cases available.'}

Return ONLY valid JSON with no extra text, no comments, no markdown:
{"impacted_tests":["id1","id2"],"risk_level":"High","reasoning":"why these tests","suggested_new_tests":["Test title 1","Test title 2"]}`;

        const responseText = await callOpenRouter([
            { role: 'system', content: 'You are a JSON-only API. Never add markdown, comments, or explanations. Return only valid JSON.' },
            { role: 'user', content: prompt }
        ]);

        let content = responseText.trim();

        // Strip any markdown fences
        content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        // Extract JSON object if extra text exists
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) content = jsonMatch[0];

        let analysis;
        try {
            analysis = JSON.parse(content);
        } catch (parseErr) {
            // Fallback: return a safe default if AI returns garbage
            analysis = {
                impacted_tests: [],
                risk_level: 'Medium',
                reasoning: 'AI response could not be parsed. Please review the diff manually.',
                suggested_new_tests: ['Regression test for changed logic', 'Edge case test for boundary conditions']
            };
        }

        // Populate test case details for the frontend
        if (analysis.impacted_tests && Array.isArray(analysis.impacted_tests)) {
            analysis.impacted_test_details = testCases.filter(t =>
                analysis.impacted_tests.includes(t._id.toString())
            );
        } else {
            analysis.impacted_test_details = [];
        }

        res.json(analysis);
    } catch (err) {
        console.error('TIA Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to analyze diff', details: err.message });
    }
});

module.exports = router;
