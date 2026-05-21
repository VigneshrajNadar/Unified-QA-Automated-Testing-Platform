const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const VisualProject = require('../models/VisualProject');
const VisualRun = require('../models/VisualRun');

const { captureScreenshot, captureMultiple, getPageNameFromUrl, isValidUrl } = require('../utils/playwrightRunner');
const { compareImages, generateSummary } = require('../utils/imageComparer');

// Base paths for screenshots
const UPLOAD_DIR = path.join(__dirname, '../uploads/visual-tests');
const BASELINES_DIR = path.join(UPLOAD_DIR, 'baselines');
const CURRENT_DIR = path.join(UPLOAD_DIR, 'current');
const DIFFS_DIR = path.join(UPLOAD_DIR, 'diffs');

router.post('/create-project', async (req, res) => {
    const { project_id, base_url, name } = req.body;

    if (!base_url || !isValidUrl(base_url)) return res.status(400).json({ error: 'Valid base_url is required' });

    try {
        const project = new VisualProject({
            project_id: project_id || null,
            base_url,
            name: name || null
        });

        await project.save();
        res.json({
            message: 'Visual project created successfully',
            visual_project_id: project._id,
            base_url,
            name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/projects', async (req, res) => {
    try {
        const projects = await VisualProject.find()
            .populate('project_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        // Calculate run stats manually since they are now separate collections
        const formatted = await Promise.all(projects.map(async (vp) => {
            const runStats = await VisualRun.aggregate([
                { $match: { visual_project_id: vp._id } },
                { $group: { _id: null, total_runs: { $sum: 1 }, last_run_date: { $max: "$created_at" } } }
            ]);

            return {
                ...vp,
                visual_project_id: vp._id,
                project_name: vp.project_id ? vp.project_id.name : null,
                total_runs: runStats.length > 0 ? runStats[0].total_runs : 0,
                last_run_date: runStats.length > 0 ? runStats[0].last_run_date : null
            };
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/project/:id', async (req, res) => {
    try {
        const project = await VisualProject.findById(req.params.id).lean();
        if (!project) return res.status(404).json({ error: 'Visual project not found' });
        
        res.json({ ...project, visual_project_id: project._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/run-baseline', async (req, res) => {
    const { visual_project_id, urls, browser = 'chrome', viewport = 'desktop', options = {} } = req.body;

    if (!visual_project_id || !urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'visual_project_id and urls array are required' });
    }

    try {
        const run = new VisualRun({
            visual_project_id,
            run_type: 'baseline',
            browser,
            viewport,
            status: 'running'
        });

        await run.save();

        const outputDir = path.join(BASELINES_DIR, `vp_${visual_project_id}`);
        const results = await captureMultiple(urls, browser, viewport, outputDir, options);

        let successCount = 0;
        const project = await VisualProject.findById(visual_project_id);

        for (const result of results) {
            if (result.success) {
                // Remove existing baseline for this page/browser/viewport
                project.baselines = project.baselines.filter(b => 
                    !(b.page_url === result.url && b.browser === browser && b.viewport === viewport)
                );

                project.baselines.push({
                    page_url: result.url,
                    page_name: result.pageName,
                    browser,
                    viewport,
                    image_path: result.outputPath
                });
                successCount++;
            }
        }

        await project.save();

        run.status = 'completed';
        run.total_screenshots = successCount;
        await run.save();

        res.json({
            message: 'Baseline screenshots captured successfully',
            run_id: run._id,
            total: urls.length,
            successful: successCount,
            results
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/run-comparison', async (req, res) => {
    const { visual_project_id, urls, browser = 'chrome', viewport = 'desktop', options = {} } = req.body;

    if (!visual_project_id || !urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'visual_project_id and urls array are required' });
    }

    try {
        const run = new VisualRun({
            visual_project_id,
            run_type: 'comparison',
            browser,
            viewport,
            status: 'running'
        });

        await run.save();

        const project = await VisualProject.findById(visual_project_id);
        const outputDir = path.join(CURRENT_DIR, `run_${run._id}`);
        const results = await captureMultiple(urls, browser, viewport, outputDir, options);

        const diffResults = [];
        let passedCount = 0;
        let failedCount = 0;

        for (const result of results) {
            if (!result.success) continue;

            const baseline = project.baselines
                .sort((a,b) => b.created_at - a.created_at) // latest first
                .find(b => b.page_url === result.url && b.browser === browser && b.viewport === viewport);

            if (!baseline) continue;

            const diffFilename = `${result.pageName}_diff.png`;
            const diffPath = path.join(DIFFS_DIR, `run_${run._id}`, diffFilename);

            const comparison = compareImages(baseline.image_path, result.outputPath, diffPath, options);

            if (comparison.success) {
                run.diffs.push({
                    page_url: result.url,
                    page_name: result.pageName,
                    baseline_image_id: baseline._id,
                    current_image_path: result.outputPath,
                    diff_image_path: diffPath,
                    mismatch_pixels: comparison.mismatchPixels,
                    mismatch_percentage: comparison.mismatchPercentage,
                    status: comparison.status,
                    severity: comparison.severity
                });

                diffResults.push({
                    ...comparison,
                    pageName: result.pageName,
                    pageUrl: result.url
                });

                if (comparison.status === 'fail') failedCount++;
                else passedCount++;
            }
        }

        run.status = 'completed';
        run.total_screenshots = results.length;
        run.total_diffs = diffResults.length;
        run.passed = passedCount;
        run.failed = failedCount;

        await run.save();

        const summary = generateSummary(diffResults);

        res.json({
            message: 'Comparison completed successfully',
            run_id: run._id,
            summary,
            diffs: diffResults
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/run/:runId', async (req, res) => {
    try {
        const run = await VisualRun.findById(req.params.runId).lean();
        if (!run) return res.status(404).json({ error: 'Run not found' });
        res.json({ ...run, run_id: run._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/runs/:projectId', async (req, res) => {
    try {
        const runs = await VisualRun.find({ visual_project_id: req.params.projectId })
            .sort({ created_at: -1 })
            .lean();
        res.json(runs.map(r => ({ ...r, run_id: r._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/diffs/:runId', async (req, res) => {
    try {
        const run = await VisualRun.findById(req.params.runId).lean();
        if (!run) return res.status(404).json({ error: 'Run not found' });

        const project = await VisualProject.findById(run.visual_project_id).lean();

        const diffs = run.diffs.map(d => {
            const baseline = project.baselines.find(b => b._id.toString() === d.baseline_image_id.toString());
            return {
                ...d,
                baseline_image_path: baseline ? baseline.image_path : null
            };
        }).sort((a, b) => b.mismatch_percentage - a.mismatch_percentage);

        res.json(diffs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/approve/:diffId', async (req, res) => {
    try {
        const run = await VisualRun.findOne({ "diffs._id": req.params.diffId });
        if (!run) return res.status(404).json({ error: 'Diff not found' });

        const diff = run.diffs.id(req.params.diffId);
        
        const project = await VisualProject.findById(run.visual_project_id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        const baseline = project.baselines.id(diff.baseline_image_id);
        if (baseline) {
            baseline.image_path = diff.current_image_path;
            baseline.approved_by = req.user ? req.user.userId : null;
            await project.save();
        }

        res.json({ message: 'Baseline updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/project/:id', async (req, res) => {
    try {
        await VisualProject.findByIdAndDelete(req.params.id);
        await VisualRun.deleteMany({ visual_project_id: req.params.id });
        res.json({ message: 'Visual project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
