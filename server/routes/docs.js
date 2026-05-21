const express = require('express');
const PDFDocument = require('pdfkit');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');

const router = express.Router();

// Export Test Cases for a Project
router.get('/export/testcases/:project_id', async (req, res) => {
    const projectId = req.params.project_id;

    try {
        // Fetch Project Info
        const project = await Project.findById(projectId).lean();
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Fetch Test Cases
        const testCases = await TestCase.find({ project_id: projectId })
            .populate('module_id', 'name')
            .populate('created_by', 'name')
            .sort({ module_id: 1, created_at: 1 })
            .lean();

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
            doc.text(`ID: ${tc._id} | Priority: ${tc.priority} | Status: ${tc.status}`);
            
            const moduleName = tc.module_id ? tc.module_id.name : 'General';
            const author = tc.created_by ? tc.created_by.name : 'Unknown';
            
            doc.text(`Module: ${moduleName} | Author: ${author}`);
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

    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

module.exports = router;
