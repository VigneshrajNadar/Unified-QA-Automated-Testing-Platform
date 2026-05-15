const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../database');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Export Test Cases for a Project
router.get('/export/testcases/:project_id', (req, res) => {
    const projectId = req.params.project_id;

    // Fetch Project Info
    db.get(`SELECT * FROM projects WHERE project_id = ?`, [projectId], (err, project) => {
        if (err || !project) return res.status(404).json({ message: 'Project not found' });

        // Fetch Test Cases
        db.all(`SELECT tc.*, m.name as module_name, u.name as author 
                FROM test_cases tc 
                LEFT JOIN modules m ON tc.module_id = m.module_id 
                LEFT JOIN users u ON tc.created_by = u.user_id
                WHERE tc.project_id = ? 
                ORDER BY tc.module_id, tc.test_case_id`, [projectId], (err, testCases) => {

            if (err) return res.status(500).json({ message: 'Database error' });

            const doc = new PDFDocument();

            // Set response headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=TestCases_${project.name.replace(/\s+/g, '_')}.pdf`);

            doc.pipe(res);

            // Title
            doc.fontSize(20).text(`Test Cases Report: ${project.name}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Description: ${project.description || 'N/A'}`);
            doc.text(`Generated on: ${new Date().toLocaleString()}`);
            doc.moveDown();

            // Table Header (Simulated)
            testCases.forEach((tc, index) => {
                doc.fontSize(14).text(`Test Case #${index + 1}: ${tc.title}`, { underline: true });
                doc.fontSize(10);
                doc.text(`ID: ${tc.test_case_id} | Priority: ${tc.priority} | Status: ${tc.status}`);
                doc.text(`Module: ${tc.module_name || 'General'} | Author: ${tc.author}`);
                doc.moveDown(0.5);

                doc.font('Helvetica-Bold').text('Description:');
                doc.font('Helvetica').text(tc.description || 'None');

                doc.font('Helvetica-Bold').text('Preconditions:');
                doc.font('Helvetica').text(tc.preconditions || 'None');

                doc.font('Helvetica-Bold').text('Steps:');
                doc.font('Helvetica').text(tc.steps || 'None');

                doc.font('Helvetica-Bold').text('Expected Result:');
                doc.font('Helvetica').text(tc.expected_result || 'None');

                doc.moveDown();
                doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // Separator line
                doc.moveDown();
            });

            doc.end();
        });
    });
});

module.exports = router;
