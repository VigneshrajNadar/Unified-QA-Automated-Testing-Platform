/**
 * API Testing Platform Routes
 * Collection management, request execution, and Swagger import
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { executeApiRequest, executeMultipleRequests } = require('../services/apiExecutor');
const { validateSchema } = require('../services/schemaValidator');
const { parseSwaggerSpec, convertPathsToRequests } = require('../services/swaggerParser');

// ============================================
// COLLECTION MANAGEMENT
// ============================================

/**
 * Create new API collection
 * POST /api/api-testing/collections
 */
router.post('/collections', (req, res) => {
    const { project_id, name, description, created_by } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Collection name is required' });
    }

    const sql = `INSERT INTO api_collections (project_id, name, description, created_by) VALUES (?, ?, ?, ?)`;

    db.run(sql, [project_id || null, name, description || null, created_by || null], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Collection created successfully',
            collection_id: this.lastID,
            name
        });
    });
});

/**
 * Get all collections
 * GET /api/api-testing/collections
 */
router.get('/collections', (req, res) => {
    const sql = `
        SELECT c.*, p.name as project_name,
               COUNT(r.request_id) as request_count
        FROM api_collections c
        LEFT JOIN projects p ON c.project_id = p.project_id
        LEFT JOIN api_requests r ON c.collection_id = r.collection_id
        GROUP BY c.collection_id
        ORDER BY c.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

/**
 * Get collection with all requests
 * GET /api/api-testing/collections/:id
 */
router.get('/collections/:id', (req, res) => {
    const collectionSql = `SELECT * FROM api_collections WHERE collection_id = ?`;
    const requestsSql = `SELECT * FROM api_requests WHERE collection_id = ? ORDER BY request_id ASC`;

    db.get(collectionSql, [req.params.id], (err, collection) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        db.all(requestsSql, [req.params.id], (err, requests) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                ...collection,
                requests
            });
        });
    });
});

/**
 * Delete collection
 * DELETE /api/api-testing/collections/:id
 */
router.delete('/collections/:id', (req, res) => {
    const sql = `DELETE FROM api_collections WHERE collection_id = ?`;

    db.run(sql, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Collection deleted successfully',
            changes: this.changes
        });
    });
});

// ============================================
// REQUEST MANAGEMENT
// ============================================

/**
 * Create new API request
 * POST /api/api-testing/requests
 */
router.post('/requests', (req, res) => {
    const {
        collection_id, name, method, url, headers, body, params,
        auth_type, auth_value, expected_status, schema, description
    } = req.body;

    if (!collection_id || !name || !method || !url) {
        return res.status(400).json({ error: 'collection_id, name, method, and url are required' });
    }

    const sql = `
        INSERT INTO api_requests 
        (collection_id, name, method, url, headers, body, params, auth_type, auth_value, expected_status, schema, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [
        collection_id, name, method, url,
        headers, body, params,
        auth_type || 'none', auth_value, expected_status, schema, description
    ], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Request created successfully',
            request_id: this.lastID
        });
    });
});

/**
 * Update API request
 * PUT /api/api-testing/requests/:id
 */
router.put('/requests/:id', (req, res) => {
    const {
        name, method, url, headers, body, params,
        auth_type, auth_value, expected_status, schema, description
    } = req.body;

    const sql = `
        UPDATE api_requests
        SET name = ?, method = ?, url = ?, headers = ?, body = ?, params = ?,
            auth_type = ?, auth_value = ?, expected_status = ?, schema = ?, description = ?
        WHERE request_id = ?
    `;

    db.run(sql, [
        name, method, url, headers, body, params,
        auth_type, auth_value, expected_status, schema, description,
        req.params.id
    ], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Request updated successfully',
            changes: this.changes
        });
    });
});

/**
 * Delete API request
 * DELETE /api/api-testing/requests/:id
 */
router.delete('/requests/:id', (req, res) => {
    const sql = `DELETE FROM api_requests WHERE request_id = ?`;

    db.run(sql, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Request deleted successfully',
            changes: this.changes
        });
    });
});

// ============================================
// REQUEST EXECUTION
// ============================================

/**
 * Execute single API request
 * POST /api/api-testing/execute/:id
 */
router.post('/execute/:id', async (req, res) => {
    try {
        // Get request from database
        const sql = `SELECT * FROM api_requests WHERE request_id = ?`;

        db.get(sql, [req.params.id], async (err, request) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!request) {
                return res.status(404).json({ error: 'Request not found' });
            }

            // Execute request
            const result = await executeApiRequest(request);

            // Validate schema if present
            let schema_valid = null;
            if (request.schema && result.response_body) {
                try {
                    const validation = validateSchema(request.schema, result.response_body);
                    schema_valid = validation.isValid;
                    if (!validation.isValid) {
                        result.error_message = `Schema validation failed: ${JSON.stringify(validation.errors)}`;
                    }
                } catch (e) {
                    schema_valid = false;
                }
            }

            // Save result to database
            const saveSql = `
                INSERT INTO api_test_results 
                (request_id, status_code, response_time_ms, response_body, response_headers, success, schema_valid, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(saveSql, [
                request.request_id,
                result.status_code,
                result.response_time_ms,
                result.response_body,
                result.response_headers,
                result.success,
                schema_valid,
                result.error_message
            ], function (err) {
                if (err) {
                    console.error('Error saving result:', err);
                }

                res.json({
                    ...result,
                    schema_valid,
                    result_id: this.lastID
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Execute all requests in a collection
 * POST /api/api-testing/execute-collection/:id
 */
router.post('/execute-collection/:id', async (req, res) => {
    try {
        // Get all requests in collection
        const sql = `SELECT * FROM api_requests WHERE collection_id = ? ORDER BY request_id ASC`;

        db.all(sql, [req.params.id], async (err, requests) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (requests.length === 0) {
                return res.json({ message: 'No requests in collection', results: [] });
            }

            // Execute all requests
            const results = await executeMultipleRequests(requests);

            // Save all results
            const saveSql = `
                INSERT INTO api_test_results 
                (request_id, status_code, response_time_ms, response_body, response_headers, success, schema_valid, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            for (const result of results) {
                // Validate schema if present
                const request = requests.find(r => r.request_id === result.request_id);
                let schema_valid = null;

                if (request.schema && result.response_body) {
                    try {
                        const validation = validateSchema(request.schema, result.response_body);
                        schema_valid = validation.isValid;
                    } catch (e) {
                        schema_valid = false;
                    }
                }

                db.run(saveSql, [
                    result.request_id,
                    result.status_code,
                    result.response_time_ms,
                    result.response_body,
                    result.response_headers,
                    result.success,
                    schema_valid,
                    result.error_message
                ]);
            }

            res.json({
                message: 'Collection executed successfully',
                total: results.length,
                results
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TEST RESULTS
// ============================================

/**
 * Get test history for a request
 * GET /api/api-testing/results/:requestId
 */
router.get('/results/:requestId', (req, res) => {
    const sql = `
        SELECT * FROM api_test_results 
        WHERE request_id = ? 
        ORDER BY executed_at DESC 
        LIMIT 50
    `;

    db.all(sql, [req.params.requestId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ============================================
// SWAGGER IMPORT
// ============================================

// ============================================
// SWAGGER IMPORT
// ============================================

/**
 * Import API collection from Swagger/OpenAPI spec
 * POST /api/api-testing/import-swagger
 */
router.post('/import-swagger', async (req, res) => {
    try {
        const { swagger_url, project_id, collection_name } = req.body;

        if (!swagger_url) {
            return res.status(400).json({ error: 'swagger_url is required' });
        }

        console.log('Importing Swagger from:', swagger_url);

        // Parse Swagger spec
        const parsed = await parseSwaggerSpec(swagger_url);

        if (!parsed.success) {
            console.error('Swagger parse error:', parsed.error);
            return res.status(400).json({ error: `Failed to parse Swagger: ${parsed.error}` });
        }

        console.log('Swagger parsed successfully:', parsed.title);

        // Create collection
        const collectionSql = `INSERT INTO api_collections (project_id, name, description) VALUES (?, ?, ?)`;
        const collName = collection_name || parsed.title;
        const collDesc = `Imported from Swagger: ${parsed.description || swagger_url}`;

        db.run(collectionSql, [project_id || null, collName, collDesc], function (err) {
            if (err) {
                console.error('Database error creating collection:', err);
                return res.status(500).json({ error: `Database error: ${err.message}` });
            }

            const collection_id = this.lastID;
            console.log('Collection created with ID:', collection_id);

            // Convert paths to requests
            const requests = convertPathsToRequests(parsed.paths, parsed.baseUrl);
            console.log('Converted to', requests.length, 'requests');

            if (requests.length === 0) {
                return res.json({
                    message: 'Swagger imported but no requests found',
                    collection_id,
                    collection_name: collName,
                    requests_imported: 0,
                    total_endpoints: 0
                });
            }

            // Insert all requests
            const requestSql = `
                INSERT INTO api_requests 
                (collection_id, name, method, url, headers, body, params, auth_type, expected_status, schema, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            let insertedCount = 0;
            let errors = [];

            requests.forEach((request, index) => {
                db.run(requestSql, [
                    collection_id,
                    request.name,
                    request.method,
                    request.url,
                    request.headers,
                    request.body,
                    request.params,
                    request.auth_type,
                    request.expected_status,
                    request.schema,
                    request.description
                ], (err) => {
                    if (err) {
                        console.error('Error inserting request:', err);
                        errors.push(err.message);
                    } else {
                        insertedCount++;
                    }

                    // Send response after all inserts
                    if (index === requests.length - 1) {
                        setTimeout(() => {
                            res.json({
                                message: 'Swagger spec imported successfully',
                                collection_id,
                                collection_name: collName,
                                requests_imported: insertedCount,
                                total_endpoints: requests.length,
                                errors: errors.length > 0 ? errors : undefined
                            });
                        }, 500);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Swagger import error:', error);
        res.status(500).json({ error: `Import failed: ${error.message}` });
    }
});

// ============================================
// API MONITORING
// ============================================

const { scheduleMonitor, stopMonitor } = require('../services/monitorScheduler');

/**
 * Get all monitors
 * GET /api/api-testing/monitors
 */
router.get('/monitors', (req, res) => {
    const sql = `
        SELECT m.*, c.name as collection_name 
        FROM api_monitors m
        JOIN api_collections c ON m.collection_id = c.collection_id
        ORDER BY m.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/**
 * Create new monitor
 * POST /api/api-testing/monitors
 */
router.post('/monitors', (req, res) => {
    const { collection_id, name, frequency } = req.body;

    if (!collection_id || !name || !frequency) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simple cron mapping
    let cron = frequency;
    if (frequency === '1min') cron = '*/1 * * * *';
    if (frequency === '5min') cron = '*/5 * * * *';
    if (frequency === '15min') cron = '*/15 * * * *';
    if (frequency === '1hour') cron = '0 * * * *';

    const sql = `INSERT INTO api_monitors (collection_id, name, frequency_cron) VALUES (?, ?, ?)`;

    db.run(sql, [collection_id, name, cron], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const monitor = {
            monitor_id: this.lastID,
            collection_id,
            name,
            frequency_cron: cron,
            is_active: 1
        };

        // Start monitor
        scheduleMonitor(monitor);

        res.json({ message: 'Monitor created', monitor });
    });
});

/**
 * Stop/Delete monitor
 * DELETE /api/api-testing/monitors/:id
 */
router.delete('/monitors/:id', (req, res) => {
    const sql = `DELETE FROM api_monitors WHERE monitor_id = ?`;

    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        stopMonitor(req.params.id);
        res.json({ message: 'Monitor deleted' });
    });
});

/**
 * Toggle monitor status (Pause/Resume)
 * PUT /api/api-testing/monitors/:id/toggle
 */
router.put('/monitors/:id/toggle', (req, res) => {
    const { is_active } = req.body; // true or false

    const sql = `UPDATE api_monitors SET is_active = ? WHERE monitor_id = ?`;

    db.run(sql, [is_active ? 1 : 0, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        if (is_active) {
            // Need to fetch full monitor details to restart it
            db.get(`SELECT * FROM api_monitors WHERE monitor_id = ?`, [req.params.id], (err, monitor) => {
                if (!monitor) return;
                scheduleMonitor(monitor);
            });
        } else {
            stopMonitor(req.params.id);
        }

        res.json({ message: `Monitor ${is_active ? 'resumed' : 'paused'}`, is_active });
    });
});

/**
 * Get monitor history
 * GET /api/api-testing/monitors/:id/history
 */
router.get('/monitors/:id/history', (req, res) => {
    // Fetch last 100 results linked to this monitor
    const sql = `
        SELECT r.*, req.name as request_name, req.method
        FROM api_test_results r
        JOIN api_requests req ON r.request_id = req.request_id
        WHERE r.monitor_id = ?
        ORDER BY r.executed_at DESC
        LIMIT 100
    `;

    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            console.error('HISTORY QUERY ERROR:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});


module.exports = router;
