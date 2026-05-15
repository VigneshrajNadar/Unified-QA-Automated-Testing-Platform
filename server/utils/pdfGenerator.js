const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate Defect Report PDF
 */
const generateDefectReport = (defects, projectName, output) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });

        let stream;
        if (typeof output === 'string') {
            stream = fs.createWriteStream(output);
            doc.pipe(stream);
        } else {
            // Assume output is a response object (stream)
            stream = output;
            doc.pipe(stream);
        }

        // Header
        doc.fontSize(24).fillColor('#6366f1').text('Defect Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#666').text(`Project: ${projectName}`, { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Summary
        doc.fontSize(16).fillColor('#000').text('Summary');
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Total Defects: ${defects.length}`);

        const critical = defects.filter(d => d.severity === 'Critical').length;
        const high = defects.filter(d => d.severity === 'High').length;
        const medium = defects.filter(d => d.severity === 'Medium').length;
        const low = defects.filter(d => d.severity === 'Low').length;

        doc.text(`Critical: ${critical} | High: ${high} | Medium: ${medium} | Low: ${low}`);
        doc.moveDown(2);

        // Defects List
        doc.fontSize(16).text('Defect Details');
        doc.moveDown(1);

        defects.forEach((defect, index) => {
            if (doc.y > 700) doc.addPage();

            // Defect Title
            doc.fontSize(12).fillColor('#000').font('Helvetica-Bold').text(`${index + 1}. ${defect.title}`);
            doc.moveDown(0.3);

            // Basic Info
            doc.fontSize(10).fillColor('#666').font('Helvetica');
            doc.text(`Defect ID: #${defect.defect_id} | Severity: ${defect.severity || 'N/A'} | Priority: ${defect.priority || 'N/A'} | Status: ${defect.status || 'Open'}`);
            doc.text(`Created: ${defect.created_at ? new Date(defect.created_at).toLocaleDateString() : 'N/A'}`);

            // Project and Test Case Info
            if (defect.project_name) {
                doc.moveDown(0.3);
                doc.font('Helvetica-Bold').text('Project: ', { continued: true });
                doc.font('Helvetica').text(defect.project_name);
            }

            if (defect.test_case_title) {
                doc.font('Helvetica-Bold').text('Linked Test Case: ', { continued: true });
                doc.font('Helvetica').text(defect.test_case_title);
            }

            if (defect.detection_source) {
                doc.font('Helvetica-Bold').text('Detection Source: ', { continued: true });
                doc.font('Helvetica').text(defect.detection_source);
            }

            if (defect.assignee_name) {
                doc.font('Helvetica-Bold').text('Assigned To: ', { continued: true });
                doc.font('Helvetica').text(defect.assignee_name);
            }

            // Description
            if (defect.description) {
                doc.moveDown(0.5);
                doc.font('Helvetica-Bold').text('Description:');
                doc.font('Helvetica').fillColor('#444').text(defect.description, {
                    width: 500,
                    align: 'left'
                });
            }

            // Steps to Reproduce
            if (defect.steps) {
                doc.moveDown(0.5);
                doc.fillColor('#666').font('Helvetica-Bold').text('Steps to Reproduce:');
                doc.font('Helvetica').fillColor('#444').text(defect.steps, {
                    width: 500,
                    align: 'left'
                });
            }

            // Expected Result
            if (defect.expected_result) {
                doc.moveDown(0.5);
                doc.fillColor('#666').font('Helvetica-Bold').text('Expected Result:');
                doc.font('Helvetica').fillColor('#444').text(defect.expected_result, {
                    width: 500,
                    align: 'left'
                });
            }

            // Actual Result
            if (defect.actual_result) {
                doc.moveDown(0.5);
                doc.fillColor('#666').font('Helvetica-Bold').text('Actual Result:');
                doc.font('Helvetica').fillColor('#444').text(defect.actual_result, {
                    width: 500,
                    align: 'left'
                });
            }

            // Separator
            doc.moveDown(1);
            doc.strokeColor('#ddd').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);
        });

        doc.end();

        if (typeof output === 'string') {
            stream.on('finish', () => resolve(output));
            stream.on('error', reject);
        } else {
            resolve();
        }
    });
};

/**
 * Generate Test Execution Report PDF
 */
const generateExecutionReport = (runData, outputPath) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);

        doc.pipe(stream);

        // Header
        doc.fontSize(24).fillColor('#6366f1').text('Test Execution Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#666').text(`Run ID: ${runData.run_id}`, { align: 'center' });
        doc.fontSize(10).text(`Executed: ${new Date(runData.started_at).toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // Execution Summary
        doc.fontSize(16).fillColor('#000').text('Execution Summary');
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Status: ${runData.status}`);
        doc.text(`Duration: ${runData.duration || 'N/A'}`);
        doc.moveDown(1);

        // Test Results
        if (runData.testResults) {
            doc.fontSize(14).text('Test Results');
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`Total: ${runData.testResults.total || 0}`);
            doc.text(`Passed: ${runData.testResults.passed || 0}`);
            doc.text(`Failed: ${runData.testResults.failed || 0}`);
            doc.moveDown(1);
        }

        // Coverage
        if (runData.coverage) {
            doc.fontSize(14).text('Code Coverage');
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`Lines: ${runData.coverage.lines?.pct || 0}%`);
            doc.text(`Branches: ${runData.coverage.branches?.pct || 0}%`);
            doc.text(`Functions: ${runData.coverage.functions?.pct || 0}%`);
            doc.moveDown(1);
        }

        // Static Analysis
        if (runData.staticIssues) {
            doc.fontSize(14).text('Static Analysis Issues');
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`Total Issues: ${runData.staticIssues.length}`);
            doc.moveDown(1);
        }

        // Security
        if (runData.securityIssues) {
            doc.fontSize(14).text('Security Vulnerabilities');
            doc.moveDown(0.5);
            doc.fontSize(10);
            doc.text(`Total Vulnerabilities: ${runData.securityIssues.length}`);
        }

        doc.end();

        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
    });
};

module.exports = { generateDefectReport, generateExecutionReport };
