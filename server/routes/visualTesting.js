/**
 * Visual Regression Testing API Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const path = require('path');
const fs = require('fs');
const { captureScreenshot, captureMultiple, getPageNameFromUrl, isValidUrl } = require('../utils/playwrightRunner');
const { compareImages, generateSummary } = require('../utils/imageComparer');

// Base paths for screenshots
const UPLOAD_DIR = path.join(__dirname, '../uploads/visual-tests');
const BASELINES_DIR = path.join(UPLOAD_DIR, 'baselines');
const CURRENT_DIR = path.join(UPLOAD_DIR, 'current');
const DIFFS_DIR = path.join(UPLOAD_DIR, 'diffs');

/**
 * Create a new visual regression test project
 * POST /api/visual/create-project
 */
router.post('/create-project', (req, res) => {
    const { project_id, base_url, name } = req.body;

    if (!base_url || !isValidUrl(base_url)) {
        return res.status(400).json({ error: 'Valid base_url is required' });
    }

    const sql = `INSERT INTO visual_projects (project_id, base_url, name) VALUES (?, ?, ?)`;

    db.run(sql, [project_id || null, base_url, name || null], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Visual project created successfully',
            visual_project_id: this.lastID,
            base_url,
            name
        });
    });
});

/**
 * Get all visual test projects
 * GET /api/visual/projects
 */
router.get('/projects', (req, res) => {
    const sql = `
        SELECT vp.*, p.name as project_name,
               COUNT(DISTINCT vr.run_id) as total_runs,
               MAX(vr.created_at) as last_run_date
        FROM visual_projects vp
        LEFT JOIN projects p ON vp.project_id = p.project_id
        LEFT JOIN visual_runs vr ON vp.visual_project_id = vr.visual_project_id
        GROUP BY vp.visual_project_id
        ORDER BY vp.created_at DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

/**
 * Get a specific visual project
 * GET /api/visual/project/:id
 */
router.get('/project/:id', (req, res) => {
    const sql = `SELECT * FROM visual_projects WHERE visual_project_id = ?`;

    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Visual project not found' });
        }
        res.json(row);
    });
});

/**
 * Run baseline screenshot capture
 * POST /api/visual/run-baseline
 */
router.post('/run-baseline', async (req, res) => {
    const { visual_project_id, urls, browser = 'chrome', viewport = 'desktop', options = {} } = req.body;

    if (!visual_project_id) {
        return res.status(400).json({ error: 'visual_project_id is required' });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'urls array is required' });
    }

    try {
        // Create a new run
        const runSql = `INSERT INTO visual_runs (visual_project_id, run_type, browser, viewport, status) 
                        VALUES (?, 'baseline', ?, ?, 'running')`;

        db.run(runSql, [visual_project_id, browser, viewport], async function (runErr) {
            if (runErr) {
                return res.status(500).json({ error: runErr.message });
            }

            const run_id = this.lastID;

            // Capture screenshots
            const outputDir = path.join(BASELINES_DIR, `vp_${visual_project_id}`);
            const results = await captureMultiple(urls, browser, viewport, outputDir, options);

            let successCount = 0;

            // Save screenshots and baseline records
            for (const result of results) {
                if (result.success) {
                    // Save screenshot record
                    const screenshotSql = `INSERT INTO visual_screenshots (run_id, page_url, page_name, image_path) 
                                          VALUES (?, ?, ?, ?)`;

                    await new Promise((resolve, reject) => {
                        db.run(screenshotSql, [run_id, result.url, result.pageName, result.outputPath], function (err) {
                            if (err) reject(err);
                            else {
                                const screenshot_id = this.lastID;

                                // Save as baseline
                                const baselineSql = `INSERT INTO baseline_images 
                                                    (visual_project_id, page_url, page_name, browser, viewport, image_path) 
                                                    VALUES (?, ?, ?, ?, ?, ?)`;

                                db.run(baselineSql,
                                    [visual_project_id, result.url, result.pageName, browser, viewport, result.outputPath],
                                    (baselineErr) => {
                                        if (baselineErr) reject(baselineErr);
                                        else {
                                            successCount++;
                                            resolve();
                                        }
                                    }
                                );
                            }
                        });
                    });
                }
            }

            // Update run status
            const updateSql = `UPDATE visual_runs SET status = 'completed', total_screenshots = ? WHERE run_id = ?`;
            db.run(updateSql, [successCount, run_id]);

            res.json({
                message: 'Baseline screenshots captured successfully',
                run_id,
                total: urls.length,
                successful: successCount,
                results
            });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Run comparison test
 * POST /api/visual/run-comparison
 */
router.post('/run-comparison', async (req, res) => {
    const { visual_project_id, urls, browser = 'chrome', viewport = 'desktop', options = {} } = req.body;

    if (!visual_project_id) {
        return res.status(400).json({ error: 'visual_project_id is required' });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'urls array is required' });
    }

    try {
        // Create a new comparison run
        const runSql = `INSERT INTO visual_runs (visual_project_id, run_type, browser, viewport, status) 
                        VALUES (?, 'comparison', ?, ?, 'running')`;

        db.run(runSql, [visual_project_id, browser, viewport], async function (runErr) {
            if (runErr) {
                return res.status(500).json({ error: runErr.message });
            }

            const run_id = this.lastID;

            // Capture current screenshots
            const outputDir = path.join(CURRENT_DIR, `run_${run_id}`);
            const results = await captureMultiple(urls, browser, viewport, outputDir, options);

            const diffResults = [];
            let passedCount = 0;
            let failedCount = 0;

            // Compare with baselines
            for (const result of results) {
                if (!result.success) continue;

                // Save current screenshot
                const screenshotSql = `INSERT INTO visual_screenshots (run_id, page_url, page_name, image_path) 
                                      VALUES (?, ?, ?, ?)`;

                const screenshot_id = await new Promise((resolve, reject) => {
                    db.run(screenshotSql, [run_id, result.url, result.pageName, result.outputPath], function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });

                // Find matching baseline
                const baselineSql = `SELECT * FROM baseline_images 
                                    WHERE visual_project_id = ? AND page_url = ? 
                                    AND browser = ? AND viewport = ?
                                    ORDER BY created_at DESC LIMIT 1`;

                const baseline = await new Promise((resolve, reject) => {
                    db.get(baselineSql, [visual_project_id, result.url, browser, viewport], (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    });
                });

                if (!baseline) {
                    console.warn(`No baseline found for ${result.url}`);
                    continue;
                }

                // Compare images
                const diffFilename = `${result.pageName}_diff.png`;
                const diffPath = path.join(DIFFS_DIR, `run_${run_id}`, diffFilename);

                const comparison = compareImages(baseline.image_path, result.outputPath, diffPath, options);

                if (comparison.success) {
                    // Save diff record
                    const diffSql = `INSERT INTO visual_diffs 
                                    (run_id, baseline_image_id, current_image_id, page_url, page_name, 
                                     diff_image_path, mismatch_pixels, mismatch_percentage, status, severity) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                    await new Promise((resolve, reject) => {
                        db.run(diffSql, [
                            run_id, baseline.baseline_id, screenshot_id, result.url, result.pageName,
                            diffPath, comparison.mismatchPixels, comparison.mismatchPercentage,
                            comparison.status, comparison.severity
                        ], function (err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        });
                    });

                    diffResults.push({
                        ...comparison,
                        pageName: result.pageName,
                        pageUrl: result.url
                    });

                    if (comparison.status === 'fail') {
                        failedCount++;

                        // Auto-create defect for high severity failures
                        if (comparison.severity === 'High' || comparison.severity === 'Critical') {
                            // TODO: Auto-create defect
                            console.log(`Auto-creating defect for ${result.url}`);
                        }
                    } else if (comparison.status === 'pass') {
                        passedCount++;
                    }
                }
            }

            // Update run with summary
            const updateSql = `UPDATE visual_runs 
                              SET status = 'completed', total_screenshots = ?, 
                                  total_diffs = ?, passed = ?, failed = ? 
                              WHERE run_id = ?`;

            db.run(updateSql, [results.length, diffResults.length, passedCount, failedCount, run_id]);

            const summary = generateSummary(diffResults);

            res.json({
                message: 'Comparison completed successfully',
                run_id,
                summary,
                diffs: diffResults
            });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get a specific run by run_id
 * GET /api/visual/run/:runId
 */
router.get('/run/:runId', (req, res) => {
    const sql = `SELECT * FROM visual_runs WHERE run_id = ?`;

    db.get(sql, [req.params.runId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Run not found' });
        }
        res.json(row);
    });
});

/**
 * Get runs for a visual project
 * GET /api/visual/runs/:projectId
 */
router.get('/runs/:projectId', (req, res) => {
    const sql = `SELECT * FROM visual_runs WHERE visual_project_id = ? ORDER BY created_at DESC`;

    db.all(sql, [req.params.projectId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

/**
 * Get diffs for a specific run
 * GET /api/visual/diffs/:runId
 */
router.get('/diffs/:runId', (req, res) => {
    const sql = `
        SELECT vd.*, 
               bi.image_path as baseline_image_path,
               vs.image_path as current_image_path
        FROM visual_diffs vd
        LEFT JOIN baseline_images bi ON vd.baseline_image_id = bi.baseline_id
        LEFT JOIN visual_screenshots vs ON vd.current_image_id = vs.screenshot_id
        WHERE vd.run_id = ?
        ORDER BY vd.mismatch_percentage DESC
    `;

    db.all(sql, [req.params.runId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

/**
 * Approve a diff as new baseline
 * POST /api/visual/approve/:diffId
 */
router.post('/approve/:diffId', (req, res) => {
    // Get the diff
    const getDiffSql = `SELECT vd.*, vs.image_path as current_image_path, 
                               bi.visual_project_id, bi.page_url, bi.browser, bi.viewport
                        FROM visual_diffs vd
                        JOIN visual_screenshots vs ON vd.current_image_id = vs.screenshot_id
                        JOIN baseline_images bi ON vd.baseline_image_id = bi.baseline_id
                        WHERE vd.diff_id = ?`;

    db.get(getDiffSql, [req.params.diffId], (err, diff) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!diff) {
            return res.status(404).json({ error: 'Diff not found' });
        }

        // Update baseline with new image
        const updateSql = `UPDATE baseline_images 
                          SET image_path = ?, approved_by = ? 
                          WHERE baseline_id = ?`;

        db.run(updateSql, [diff.current_image_path, req.body.user_id || null, diff.baseline_image_id], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: updateErr.message });
            }

            res.json({ message: 'Baseline updated successfully' });
        });
    });
});

/**
 * Delete a visual project
 * DELETE /api/visual/project/:id
 */
router.delete('/project/:id', (req, res) => {
    const sql = `DELETE FROM visual_projects WHERE visual_project_id = ?`;

    db.run(sql, [req.params.id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            message: 'Visual project deleted successfully',
            changes: this.changes
        });
    });
});

module.exports = router;
