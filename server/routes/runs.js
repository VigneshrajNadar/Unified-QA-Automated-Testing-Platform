const express = require('express');
const TestSuite = require('../models/TestSuite');
const TestRun = require('../models/TestRun');
const Defect = require('../models/Defect');

const router = express.Router();

// --- Test Suites ---

// Create Test Suite
router.post('/suites', async (req, res) => {
    const { project_id, name, description, test_case_ids } = req.body;

    if (!project_id || !name) return res.status(400).json({ message: 'Project and Name are required' });

    try {
        const newSuite = new TestSuite({
            project_id,
            name,
            description,
            test_cases: test_case_ids || []
        });

        await newSuite.save();
        res.status(201).json({ message: 'Test Suite created', suiteId: newSuite._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get Suites by Project
router.get('/suites', async (req, res) => {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ message: 'Project ID is required' });

    try {
        const suites = await TestSuite.find({ project_id }).sort({ created_at: -1 });
        // Map _id to test_suite_id for frontend compatibility
        res.json(suites.map(s => ({ ...s.toObject(), test_suite_id: s._id })));
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// --- Test Runs ---

// Get Runs (List)
router.get('/', async (req, res) => {
    const { project_id } = req.query;
    
    try {
        let filter = {};
        if (project_id) filter.project_id = project_id;

        const runs = await TestRun.find(filter)
            .populate('test_suite_id', 'name')
            .populate('created_by', 'name')
            .sort({ created_at: -1 })
            .lean();

        const formatted = runs.map(run => ({
            ...run,
            test_run_id: run._id,
            suite_name: run.test_suite_id ? run.test_suite_id.name : 'Unknown',
            executed_by_name: run.created_by ? run.created_by.name : 'Unknown'
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Create Test Run
router.post('/', async (req, res) => {
    const { project_id, test_suite_id, name } = req.body;

    if (!project_id || !test_suite_id || !name) return res.status(400).json({ message: 'Required fields missing' });

    try {
        const suite = await TestSuite.findById(test_suite_id);
        if (!suite) return res.status(404).json({ message: 'Test Suite not found' });

        const results = suite.test_cases.map(tcId => ({
            test_case_id: tcId,
            status: 'Not Run'
        }));

        const newRun = new TestRun({
            project_id,
            test_suite_id,
            name,
            created_by: req.user ? req.user.userId : null,
            results
        });

        await newRun.save();
        res.status(201).json({ message: 'Test Run created', runId: newRun._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get Run Details (with results)
router.get('/:id', async (req, res) => {
    try {
        const run = await TestRun.findById(req.params.id)
            .populate('test_suite_id', 'name')
            .populate('created_by', 'name')
            .populate({
                path: 'results.test_case_id',
                select: 'title priority'
            })
            .lean();

        if (!run) return res.status(404).json({ message: 'Run not found' });

        // Flatten results for frontend
        const formattedResults = run.results.map(r => ({
            ...r,
            test_case_id: r.test_case_id ? r.test_case_id._id : null,
            title: r.test_case_id ? r.test_case_id.title : 'Deleted Case',
            priority: r.test_case_id ? r.test_case_id.priority : 'Unknown'
        }));

        res.json({
            ...run,
            test_run_id: run._id,
            suite_name: run.test_suite_id ? run.test_suite_id.name : 'Unknown',
            executed_by_name: run.created_by ? run.created_by.name : 'Unknown',
            results: formattedResults
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Update Result (Execute)
router.post('/:id/results', async (req, res) => {
    const runId = req.params.id;
    const { test_case_id, status, actual_result, comments } = req.body;

    try {
        const run = await TestRun.findOneAndUpdate(
            { _id: runId, "results.test_case_id": test_case_id },
            { 
                $set: { 
                    "results.$.status": status,
                    "results.$.actual_result": actual_result,
                    "results.$.comments": comments
                }
            },
            { new: true }
        );

        if (!run) return res.status(404).json({ message: 'Run or Test Case not found' });
        res.json({ message: 'Result updated' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Stubs for metrics that need more advanced modeling
router.get('/:id/static-issues', (req, res) => res.json([]));
router.get('/:id/security-issues', (req, res) => res.json([]));
router.get('/:id/complexity-metrics', (req, res) => res.json([]));
router.get('/:id/coverage-summary', (req, res) => res.json(null));
router.get('/:id/test-type-results', (req, res) => res.json([]));

// Compare two runs
router.get('/compare/:runId1/:runId2', async (req, res) => {
    const { runId1, runId2 } = req.params;

    try {
        const [defects1, defects2] = await Promise.all([
            Defect.find({ test_run_id: runId1 }).lean(),
            Defect.find({ test_run_id: runId2 }).lean()
        ]);

        const newDefects = defects2.filter(d2 => !defects1.some(d1 => d1.title === d2.title));
        const fixedDefects = defects1.filter(d1 => !defects2.some(d2 => d2.title === d1.title));
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
