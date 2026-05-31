const express = require('express');
const path = require('path');
const Defect = require('../models/Defect');
const TestRun = require('../models/TestRun');
const SecurityScan = require('../models/SecurityScan'); // If related to execution
const { generateDefectReport, generateExecutionReport } = require('../utils/pdfGenerator');
const { generateDefectsExcel } = require('../utils/excelGenerator');

const router = express.Router();

// Generate Defect Report PDF
router.get('/defects/:runId/pdf', async (req, res) => {
    const { runId } = req.params;

    try {
        const defects = await Defect.find({
            $or: [
                { test_run_id: runId }
            ]
        }).lean();

        // If no defects found for run, attempt by project
        if (defects.length === 0) {
            const run = await TestRun.findById(runId).lean();
            if (run && run.project_id) {
                const projDefects = await Defect.find({ project_id: run.project_id }).lean();
                defects.push(...projDefects);
            }
        }

        const outputPath = path.join(__dirname, '../temp_uploads', `defects_${runId}_${Date.now()}.pdf`);
        await generateDefectReport(defects, `Run ${runId}`, outputPath);

        res.download(outputPath, `defect_report_${runId}.pdf`, (err) => {
            if (!err) {
                setTimeout(() => {
                    try { require('fs').unlinkSync(outputPath); } catch (e) { }
                }, 5000);
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate Defects Excel
router.get('/defects/:runId/excel', async (req, res) => {
    const { runId } = req.params;

    try {
        const defects = await Defect.find({
            $or: [
                { test_run_id: runId }
            ]
        }).lean();

        if (defects.length === 0) {
            const run = await TestRun.findById(runId).lean();
            if (run && run.project_id) {
                const projDefects = await Defect.find({ project_id: run.project_id }).lean();
                defects.push(...projDefects);
            }
        }

        const outputPath = path.join(__dirname, '../temp_uploads', `defects_${runId}_${Date.now()}.xlsx`);
        await generateDefectsExcel(defects, `Run ${runId}`, outputPath);

        res.download(outputPath, `defect_report_${runId}.xlsx`, (err) => {
            if (!err) {
                setTimeout(() => {
                    try { require('fs').unlinkSync(outputPath); } catch (e) { }
                }, 5000);
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate Execution Report PDF
router.get('/execution/:runId/pdf', async (req, res) => {
    const { runId } = req.params;

    try {
        const run = await TestRun.findById(runId).lean();
        if (!run) return res.status(404).json({ error: 'Run not found' });

        const staticIssues = []; // Deprecated table
        const securityIssues = []; // Deprecated table, use SecurityScan if needed

        const runData = {
            ...run,
            staticIssues,
            securityIssues
        };

        const outputPath = path.join(__dirname, '../temp_uploads', `execution_${runId}_${Date.now()}.pdf`);
        await generateExecutionReport(runData, outputPath);

        res.download(outputPath, `execution_report_${runId}.pdf`, (err) => {
            if (!err) {
                setTimeout(() => {
                    try { require('fs').unlinkSync(outputPath); } catch (e) { }
                }, 5000);
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate ALL Defects Report PDF
router.get('/defects/all/pdf', async (req, res) => {
    try {
        const defects = await Defect.find()
            .populate('project_id', 'name')
            .populate('test_case_id', 'title')
            .sort({ created_at: -1 })
            .lean();

        const formattedDefects = defects.map(d => ({
            ...d,
            project_name: d.project_id ? d.project_id.name : null,
            test_case_title: d.test_case_id ? d.test_case_id.title : null
        }));

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=all_defects_report.pdf`);

        try {
            await generateDefectReport(formattedDefects, 'All Defects', res);
        } catch (pdfErr) {
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to generate PDF', details: pdfErr.message });
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate ALL Defects Excel
router.get('/defects/all/excel', async (req, res) => {
    try {
        const defects = await Defect.find()
            .populate('project_id', 'name')
            .populate('test_case_id', 'title')
            .sort({ created_at: -1 })
            .lean();

        const formattedDefects = defects.map(d => ({
            ...d,
            project_name: d.project_id ? d.project_id.name : null,
            test_case_title: d.test_case_id ? d.test_case_id.title : null
        }));

        const outputPath = path.join(__dirname, '../temp_uploads', `all_defects_${Date.now()}.xlsx`);
        await generateDefectsExcel(formattedDefects, 'All Defects', outputPath);

        res.download(outputPath, `all_defects_report.xlsx`, (err) => {
            if (!err) {
                setTimeout(() => {
                    try { require('fs').unlinkSync(outputPath); } catch (e) { }
                }, 5000);
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
