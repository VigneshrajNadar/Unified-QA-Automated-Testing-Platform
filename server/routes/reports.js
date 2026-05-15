const express = require('express');
const path = require('path');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');
const { generateDefectReport, generateExecutionReport } = require('../utils/pdfGenerator');
const { generateDefectsExcel } = require('../utils/excelGenerator');

const router = express.Router();

// Generate Defect Report PDF
router.get('/defects/:runId/pdf', async (req, res) => {
    const { runId } = req.params;

    try {
        // Fetch defects for this run
        db.all(`SELECT * FROM defects WHERE test_run_id = ? OR project_id IN (SELECT project_id FROM test_runs WHERE test_run_id = ?)`,
            [runId, runId],
            async (err, defects) => {
                if (err) return res.status(500).json({ error: err.message });

                const outputPath = path.join(__dirname, '../../temp_uploads', `defects_${runId}_${Date.now()}.pdf`);

                await generateDefectReport(defects, `Run ${runId}`, outputPath);

                res.download(outputPath, `defect_report_${runId}.pdf`, (err) => {
                    if (!err) {
                        // Cleanup file after download
                        setTimeout(() => {
                            try { require('fs').unlinkSync(outputPath); } catch (e) { }
                        }, 5000);
                    }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate Defects Excel
router.get('/defects/:runId/excel', async (req, res) => {
    const { runId } = req.params;

    try {
        db.all(`SELECT * FROM defects WHERE test_run_id = ? OR project_id IN (SELECT project_id FROM test_runs WHERE test_run_id = ?)`,
            [runId, runId],
            async (err, defects) => {
                if (err) return res.status(500).json({ error: err.message });

                const outputPath = path.join(__dirname, '../../temp_uploads', `defects_${runId}_${Date.now()}.xlsx`);

                await generateDefectsExcel(defects, `Run ${runId}`, outputPath);

                res.download(outputPath, `defect_report_${runId}.xlsx`, (err) => {
                    if (!err) {
                        setTimeout(() => {
                            try { require('fs').unlinkSync(outputPath); } catch (e) { }
                        }, 5000);
                    }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate Execution Report PDF
router.get('/execution/:runId/pdf', async (req, res) => {
    const { runId } = req.params;

    try {
        // Fetch run data
        db.get(`SELECT * FROM test_runs WHERE test_run_id = ?`, [runId], async (err, run) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!run) return res.status(404).json({ error: 'Run not found' });

            // Fetch related data
            const staticIssues = await new Promise((resolve) => {
                db.all(`SELECT * FROM static_issues WHERE run_id = ?`, [runId], (err, rows) => {
                    resolve(rows || []);
                });
            });

            const securityIssues = await new Promise((resolve) => {
                db.all(`SELECT * FROM security_issues WHERE run_id = ?`, [runId], (err, rows) => {
                    resolve(rows || []);
                });
            });

            const runData = {
                ...run,
                staticIssues,
                securityIssues
            };

            const outputPath = path.join(__dirname, '../../temp_uploads', `execution_${runId}_${Date.now()}.pdf`);

            await generateExecutionReport(runData, outputPath);

            res.download(outputPath, `execution_report_${runId}.pdf`, (err) => {
                if (!err) {
                    setTimeout(() => {
                        try { require('fs').unlinkSync(outputPath); } catch (e) { }
                    }, 5000);
                }
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate ALL Defects Report PDF
router.get('/defects/all/pdf', async (req, res) => {
    console.log('📄 PDF Export Request - Fetching all defects...');
    try {
        db.all(`SELECT d.*, p.name as project_name, tc.title as test_case_title 
                FROM defects d 
                LEFT JOIN projects p ON d.project_id = p.project_id 
                LEFT JOIN test_cases tc ON d.test_case_id = tc.test_case_id
                ORDER BY d.defect_id DESC`,
            async (err, defects) => {
                if (err) {
                    console.error('❌ Database error fetching defects:', err);
                    return res.status(500).json({ error: err.message });
                }

                console.log(`✅ Found ${defects.length} defects in database`);

                // Set headers for PDF download
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=all_defects_report.pdf`);

                console.log('📝 Streaming PDF directly to client...');

                try {
                    await generateDefectReport(defects, 'All Defects', res);
                    console.log('✅ PDF streamed successfully');
                } catch (pdfErr) {
                    console.error('❌ PDF generation error:', pdfErr);
                    // If headers are already sent, we can't send JSON error
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Failed to generate PDF', details: pdfErr.message });
                    }
                }
            }
        );
    } catch (err) {
        console.error('❌ Outer error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Generate ALL Defects Excel
router.get('/defects/all/excel', async (req, res) => {
    try {
        db.all(`SELECT d.*, p.name as project_name, tc.title as test_case_title 
                FROM defects d 
                LEFT JOIN projects p ON d.project_id = p.project_id 
                LEFT JOIN test_cases tc ON d.test_case_id = tc.test_case_id
                ORDER BY d.defect_id DESC`,
            async (err, defects) => {
                if (err) return res.status(500).json({ error: err.message });

                const outputPath = path.join(__dirname, '../../temp_uploads', `all_defects_${Date.now()}.xlsx`);

                await generateDefectsExcel(defects, 'All Defects', outputPath);

                res.download(outputPath, `all_defects_report.xlsx`, (err) => {
                    if (!err) {
                        setTimeout(() => {
                            try { require('fs').unlinkSync(outputPath); } catch (e) { }
                        }, 5000);
                    }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
