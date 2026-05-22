const express = require('express');
const router = express.Router();
const ApiCollection = require('../models/ApiCollection');
const ApiMonitor = require('../models/ApiMonitor');
const { executeApiRequest, executeMultipleRequests } = require('../services/apiExecutor');
const { validateSchema } = require('../services/schemaValidator');
const { parseSwaggerSpec, convertPathsToRequests } = require('../services/swaggerParser');
const { scheduleMonitor, stopMonitor } = require('../services/monitorScheduler');

// ============================================
// COLLECTION MANAGEMENT
// ============================================

router.post('/collections', async (req, res) => {
    const { project_id, name, description } = req.body;

    if (!name) return res.status(400).json({ error: 'Collection name is required' });

    try {
        const newCollection = new ApiCollection({
            project_id: project_id || null,
            name,
            description: description || null,
            created_by: req.user ? req.user.userId : null
        });

        await newCollection.save();
        res.json({
            message: 'Collection created successfully',
            collection_id: newCollection._id,
            name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/collections', async (req, res) => {
    try {
        const collections = await ApiCollection.find()
            .populate('project_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const formatted = collections.map(c => ({
            ...c,
            collection_id: c._id,
            project_name: c.project_id ? c.project_id.name : null,
            request_count: c.requests ? c.requests.length : 0
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/collections/:id', async (req, res) => {
    try {
        const collection = await ApiCollection.findById(req.params.id).lean();
        if (!collection) return res.status(404).json({ error: 'Collection not found' });

        // Map request._id to request_id for frontend
        const formattedRequests = collection.requests.map(r => ({
            ...r,
            request_id: r._id,
            collection_id: collection._id
        }));

        res.json({
            ...collection,
            collection_id: collection._id,
            requests: formattedRequests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/collections/:id', async (req, res) => {
    try {
        await ApiCollection.findByIdAndDelete(req.params.id);
        // Also delete associated monitors
        await ApiMonitor.deleteMany({ collection_id: req.params.id });
        res.json({ message: 'Collection deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// REQUEST MANAGEMENT
// ============================================

router.post('/requests', async (req, res) => {
    const { collection_id, name, method, url, headers, body, params, auth_type, auth_value, expected_status, schema, description } = req.body;

    if (!collection_id || !name || !method || !url) {
        return res.status(400).json({ error: 'collection_id, name, method, and url are required' });
    }

    try {
        const collection = await ApiCollection.findById(collection_id);
        if (!collection) return res.status(404).json({ error: 'Collection not found' });

        const newRequest = {
            name, method, url, headers, body, params,
            auth_type: auth_type || 'none', auth_value, expected_status, schema, description
        };

        collection.requests.push(newRequest);
        await collection.save();

        const addedRequest = collection.requests[collection.requests.length - 1];

        res.json({
            message: 'Request created successfully',
            request_id: addedRequest._id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/requests/:id', async (req, res) => {
    const updateData = req.body;

    try {
        const collection = await ApiCollection.findOne({ "requests._id": req.params.id });
        if (!collection) return res.status(404).json({ error: 'Request not found' });

        const request = collection.requests.id(req.params.id);
        Object.assign(request, updateData);
        await collection.save();

        res.json({ message: 'Request updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/requests/:id', async (req, res) => {
    try {
        const collection = await ApiCollection.findOne({ "requests._id": req.params.id });
        if (!collection) return res.status(404).json({ error: 'Request not found' });

        collection.requests.pull(req.params.id);
        await collection.save();

        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// REQUEST EXECUTION
// ============================================

router.post('/execute/:id', async (req, res) => {
    try {
        const collection = await ApiCollection.findOne({ "requests._id": req.params.id });
        if (!collection) return res.status(404).json({ error: 'Request not found' });

        const request = collection.requests.id(req.params.id);
        
        // Map _id to request_id for the executor service
        const reqObj = { ...request.toObject(), request_id: request._id };

        const result = await executeApiRequest(reqObj);

        let schema_valid = null;
        if (request.schema && result.response_body) {
            try {
                const validation = validateSchema(request.schema, result.response_body);
                schema_valid = validation.isValid;
                if (validation.isValid === false) {
                    result.error_message = `Schema validation failed: ${JSON.stringify(validation.errors)}`;
                }
            } catch (e) {
                schema_valid = false;
            }
        }

        // Save result
        request.results.push({
            status_code: result.status_code,
            response_time: result.response_time_ms,
            response_body: result.response_body,
            passed: result.success && (schema_valid !== false)
        });
        await collection.save();

        res.json({
            ...result,
            schema_valid,
            result_id: request.results[request.results.length - 1]._id
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/execute-collection/:id', async (req, res) => {
    try {
        const collection = await ApiCollection.findById(req.params.id);
        if (!collection) return res.status(404).json({ error: 'Collection not found' });

        if (collection.requests.length === 0) {
            return res.json({ message: 'No requests in collection', results: [] });
        }

        const reqsObj = collection.requests.map(r => ({ ...r.toObject(), request_id: r._id }));
        const results = await executeMultipleRequests(reqsObj);

        for (const result of results) {
            const request = collection.requests.id(result.request_id);
            if (request) {
                let schema_valid = null;
                if (request.schema && result.response_body) {
                    try {
                        const validation = validateSchema(request.schema, result.response_body);
                        schema_valid = validation.isValid;
                    } catch (e) {
                        schema_valid = false;
                    }
                }
                
                request.results.push({
                    status_code: result.status_code,
                    response_time: result.response_time_ms,
                    response_body: result.response_body,
                    passed: result.success && (schema_valid !== false)
                });
            }
        }
        await collection.save();

        res.json({
            message: 'Collection executed successfully',
            total: results.length,
            results
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TEST RESULTS
// ============================================

router.get('/results/:requestId', async (req, res) => {
    try {
        const collection = await ApiCollection.findOne({ "requests._id": req.params.requestId });
        if (!collection) return res.status(404).json({ error: 'Request not found' });

        const request = collection.requests.id(req.params.requestId);
        
        // Sort results descending
        const results = [...request.results].sort((a, b) => b.executed_at - a.executed_at).slice(0, 50);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SWAGGER IMPORT
// ============================================

router.post('/import-swagger', async (req, res) => {
    try {
        const { swagger_url, project_id, collection_name } = req.body;

        if (!swagger_url) return res.status(400).json({ error: 'swagger_url is required' });

        const parsed = await parseSwaggerSpec(swagger_url);
        if (!parsed.success) return res.status(400).json({ error: `Failed to parse Swagger: ${parsed.error}` });

        const collName = collection_name || parsed.title;
        const collDesc = `Imported from Swagger: ${parsed.description || swagger_url}`;

        const newCollection = new ApiCollection({
            project_id: project_id || null,
            name: collName,
            description: collDesc,
            requests: convertPathsToRequests(parsed.paths, parsed.baseUrl).map(r => ({
                ...r,
                auth_type: r.auth_type || 'none'
            }))
        });

        await newCollection.save();

        res.json({
            message: 'Swagger spec imported successfully',
            collection_id: newCollection._id,
            collection_name: collName,
            requests_imported: newCollection.requests.length,
            total_endpoints: parsed.paths ? Object.keys(parsed.paths).length : 0
        });

    } catch (error) {
        res.status(500).json({ error: `Import failed: ${error.message}` });
    }
});

// ============================================
// API MONITORING
// ============================================

router.get('/monitors', async (req, res) => {
    try {
        const monitors = await ApiMonitor.find()
            .populate('collection_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const formatted = monitors.map(m => ({
            ...m,
            monitor_id: m._id,
            collection_name: m.collection_id ? m.collection_id.name : null
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/monitors', async (req, res) => {
    const { collection_id, name, frequency } = req.body;

    if (!collection_id || !name || !frequency) return res.status(400).json({ error: 'Missing required fields' });

    let cron = frequency;
    if (frequency === '1min') cron = '*/1 * * * *';
    if (frequency === '5min') cron = '*/5 * * * *';
    if (frequency === '15min') cron = '*/15 * * * *';
    if (frequency === '1hour') cron = '0 * * * *';

    try {
        const monitor = new ApiMonitor({
            collection_id,
            name,
            frequency_cron: cron
        });

        await monitor.save();
        
        const monitorObj = {
            monitor_id: monitor._id.toString(),
            collection_id: monitor.collection_id.toString(),
            name: monitor.name,
            frequency_cron: monitor.frequency_cron,
            is_active: monitor.is_active
        };

        try {
            scheduleMonitor(monitorObj);
        } catch (e) {
            console.log("Monitor scheduler not fully converted to Mongo yet:", e.message);
        }

        res.json({ message: 'Monitor created', monitor: monitorObj });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/monitors/:id', async (req, res) => {
    try {
        await ApiMonitor.findByIdAndDelete(req.params.id);
        
        try { stopMonitor(req.params.id); } catch(e){}
        
        res.json({ message: 'Monitor deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/monitors/:id/toggle', async (req, res) => {
    const { is_active } = req.body;

    try {
        const monitor = await ApiMonitor.findByIdAndUpdate(
            req.params.id,
            { is_active: !!is_active },
            { new: true }
        ).lean();

        if (monitor) {
            try {
                if (is_active) {
                    const monitorObj = { ...monitor, monitor_id: monitor._id.toString() };
                    scheduleMonitor(monitorObj);
                } else {
                    stopMonitor(req.params.id);
                }
            } catch(e){}
        }

        res.json({ message: `Monitor ${is_active ? 'resumed' : 'paused'}`, is_active });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/monitors/:id/history', async (req, res) => {
    // Monitor history is stored in ApiCollection.requests.results but we don't have a direct link easily.
    // For now, returning empty array as placeholder until monitor service is fully refactored
    res.json([]);
});

module.exports = router;
