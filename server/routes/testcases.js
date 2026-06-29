const express = require('express');
const TestCase = require('../models/TestCase');

const router = express.Router();

// Get all test types (stubbed for now since we haven't migrated TestTypes yet)
router.get('/types', (req, res) => {
    res.json([
        { test_type_id: 1, name: 'Functional' },
        { test_type_id: 2, name: 'UI' },
        { test_type_id: 3, name: 'Performance' },
        { test_type_id: 4, name: 'Security' }
    ]);
});

// Get test cases (with filters)
router.get('/', async (req, res) => {
    const { project_id, module_id, search } = req.query;

    try {
        let filter = {};
        if (req.user && req.user.role && req.user.role.toLowerCase() !== 'admin') {
            // Let testers view all test cases for the projects they have access to.
            // If they are developers, maybe restrict. But currently 'tester' should see all tests in a project.
            // So we don't strictly filter by created_by here, we rely on the project level RBAC later.
        }
        if (project_id) {
            filter.project_id = project_id;
        }
        if (module_id) {
            filter.module_id = module_id;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const testCases = await TestCase.find(filter)
                                        .populate('created_by', 'name')
                                        .populate('project_id', 'name')
                                        .sort({ created_at: -1 })
                                        .lean();

        // Standardize output to match expected frontend field names from old SQLite rows if possible
        const formatted = testCases.map(tc => ({
            ...tc,
            test_case_id: tc._id, // map Mongo _id to old SQLite ID format
            project_name: tc.project_id ? tc.project_id.name : null,
            created_by_name: tc.created_by ? tc.created_by.name : null,
            test_types: [] // Stubbed
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Create test case
router.post('/', async (req, res) => {
    const { project_id, module_id, title, description, preconditions, steps, expected_result, priority, test_type } = req.body;

    if (!project_id || !title) return res.status(400).json({ message: 'Project and Title are required' });

    try {
        const newTestCase = new TestCase({
            project_id,
            module_id: module_id || null,
            title,
            description,
            preconditions,
            steps,
            expected_result,
            priority,
            test_type: test_type || 'Manual',
            created_by: req.user ? req.user.userId : null
        });

        await newTestCase.save();
        res.status(201).json({ message: 'Test case created', testCaseId: newTestCase._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Update test case
router.put('/:id', async (req, res) => {
    const { title, description, preconditions, steps, expected_result, priority, status, test_type } = req.body;
    const testCaseId = req.params.id;

    try {
        const testCase = await TestCase.findByIdAndUpdate(
            testCaseId,
            { 
                title, 
                description, 
                preconditions,
                steps,
                expected_result, 
                priority, 
                status, 
                test_type,
                updated_at: Date.now() 
            },
            { new: true }
        );

        if (!testCase) return res.status(404).json({ message: 'Test case not found' });
        res.json({ message: 'Test case updated' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Delete test case
router.delete('/:id', async (req, res) => {
    try {
        const result = await TestCase.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Test case not found' });
        res.json({ message: 'Test case deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Clone Test Case
router.post('/:id/clone', async (req, res) => {
    try {
        const original = await TestCase.findById(req.params.id);
        if (!original) return res.status(404).json({ message: 'Test case not found' });
        
        const clone = new TestCase({
            project_id: original.project_id,
            module_id: original.module_id,
            title: `Copy of ${original.title}`,
            description: original.description,
            preconditions: original.preconditions,
            steps: original.steps,
            expected_result: original.expected_result,
            priority: original.priority,
            test_type: original.test_type,
            status: 'Draft',
            created_by: req.user ? req.user.userId : null
        });

        await clone.save();
        res.status(201).json({ message: 'Test case cloned successfully', testCaseId: clone._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Bulk Delete Test Cases
router.post('/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No IDs provided' });
    }
    
    try {
        await TestCase.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${ids.length} test cases deleted` });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;
