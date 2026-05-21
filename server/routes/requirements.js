const express = require('express');
const Requirement = require('../models/Requirement');

const router = express.Router();

// 1. GET ALL (With RTM & Hierarchy Info)
router.get('/', async (req, res) => {
    const { project_id } = req.query;
    if (!project_id) return res.status(400).json({ message: 'Project ID required' });

    try {
        const reqs = await Requirement.find({ project_id })
            .populate('test_cases', 'title priority status')
            .sort({ created_at: -1 })
            .lean();

        // Format to match frontend expectations
        const formatted = reqs.map(r => ({
            ...r,
            requirement_id: r._id,
            test_cases: r.test_cases.map(tc => ({
                test_case_id: tc._id,
                title: tc.title,
                last_run_status: tc.status // Simplified status mapping
            }))
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// 2. CREATE (With Hierarchy)
router.post('/', async (req, res) => {
    const { project_id, req_identifier, title, description, type, priority, version, parent_id, category, urgency, business_value } = req.body;

    try {
        const existing = await Requirement.findOne({ project_id, req_identifier });
        if (existing) return res.status(400).json({ message: 'Requirement ID already exists' });

        const newReq = new Requirement({
            project_id,
            req_identifier,
            title,
            description,
            type,
            priority,
            version: version || '1.0',
            status: 'Draft',
            parent_id: parent_id || null,
            category: category || 'Story',
            urgency: urgency || 'Medium',
            business_value: business_value || 0,
            created_by: req.user ? req.user.userId : null
        });

        await newReq.save();
        res.status(201).json({ message: 'Requirement created', requirementId: newReq._id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// 3. UPDATE (With Verification History)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, priority, status, type, urgency, business_value, change_reason } = req.body;

    try {
        const current = await Requirement.findById(id);
        if (!current) return res.status(404).json({ message: 'Not found' });

        // Save history snapshot
        current.history.push({
            version_number: current.version,
            title: current.title,
            description: current.description,
            change_reason: change_reason || 'Update',
            changed_by: req.user ? req.user.userId : null
        });

        // Increment Version (e.g., 1.0 -> 1.1)
        const currentVer = parseFloat(current.version || '1.0');
        const newVersion = (currentVer + 0.1).toFixed(1);

        // Update fields
        current.title = title || current.title;
        current.description = description || current.description;
        current.priority = priority || current.priority;
        current.status = status || current.status;
        current.type = type || current.type;
        current.urgency = urgency || current.urgency;
        current.business_value = business_value || current.business_value;
        current.version = newVersion;
        current.updated_at = Date.now();

        await current.save();
        res.json({ message: 'Requirement updated and versioned', newVersion });
    } catch (error) {
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
});

// 4. GET HISTORY
router.get('/:id/versions', async (req, res) => {
    try {
        const reqDoc = await Requirement.findById(req.params.id)
            .populate('history.changed_by', 'name')
            .lean();
        
        if (!reqDoc) return res.status(404).json({ message: 'Not found' });
        
        // Format history for frontend
        const history = reqDoc.history.map(h => ({
            ...h,
            changed_at: h.changed_at,
            changed_by_name: h.changed_by ? h.changed_by.name : 'Unknown'
        })).reverse();

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// 5. COMMENTS API
router.get('/:id/comments', async (req, res) => {
    try {
        const reqDoc = await Requirement.findById(req.params.id)
            .populate('comments.user_id', 'name')
            .lean();
        
        if (!reqDoc) return res.status(404).json({ message: 'Not found' });

        const comments = reqDoc.comments.map(c => ({
            ...c,
            user_name: c.user_id ? c.user_id.name : 'Unknown'
        })).reverse();

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/:id/comments', async (req, res) => {
    const { comment_text } = req.body;
    
    try {
        const reqDoc = await Requirement.findById(req.params.id);
        if (!reqDoc) return res.status(404).json({ message: 'Not found' });

        reqDoc.comments.push({
            user_id: req.user ? req.user.userId : null,
            comment_text
        });

        await reqDoc.save();
        res.json({ message: 'Comment added', commentId: reqDoc.comments[reqDoc.comments.length - 1]._id });
    } catch (error) {
        res.status(500).json({ message: 'Failed to post comment', error: error.message });
    }
});

// LINK Test Case (Existing)
router.post('/link', async (req, res) => {
    const { requirement_id, test_case_id } = req.body;
    
    try {
        const reqDoc = await Requirement.findById(requirement_id);
        if (!reqDoc) return res.status(404).json({ message: 'Requirement not found' });

        if (!reqDoc.test_cases.includes(test_case_id)) {
            reqDoc.test_cases.push(test_case_id);
            await reqDoc.save();
        }

        res.json({ message: 'Linked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;
