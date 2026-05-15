const ExcelJS = require('exceljs');

/**
 * Generate Defects Excel Report
 */
const generateDefectsExcel = async (defects, projectName, outputPath) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Defects');

    // Header styling
    worksheet.columns = [
        { header: 'Defect ID', key: 'defect_id', width: 12 },
        { header: 'Title', key: 'title', width: 35 },
        { header: 'Project', key: 'project_name', width: 25 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Test Case', key: 'test_case_title', width: 30 },
        { header: 'Detection Source', key: 'detection_source', width: 20 },
        { header: 'Assignee', key: 'assignee_name', width: 20 },
        { header: 'Steps to Reproduce', key: 'steps', width: 40 },
        { header: 'Expected Result', key: 'expected_result', width: 30 },
        { header: 'Actual Result', key: 'actual_result', width: 30 },
        { header: 'Created At', key: 'created_at', width: 20 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6366F1' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data
    defects.forEach(defect => {
        const row = worksheet.addRow({
            defect_id: defect.defect_id,
            title: defect.title || '',
            project_name: defect.project_name || 'N/A',
            severity: defect.severity || 'N/A',
            priority: defect.priority || 'N/A',
            status: defect.status || 'Open',
            description: defect.description || '',
            test_case_title: defect.test_case_title || 'N/A',
            detection_source: defect.detection_source || 'Manual Testing',
            assignee_name: defect.assignee_name || 'Unassigned',
            steps: defect.steps || '',
            expected_result: defect.expected_result || '',
            actual_result: defect.actual_result || '',
            created_at: defect.created_at ? new Date(defect.created_at).toLocaleString() : 'N/A'
        });

        // Enable text wrapping for long content
        row.alignment = { vertical: 'top', wrapText: true };

        // Color code by severity
        if (defect.severity === 'Critical') {
            row.getCell('severity').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDC2626' }
            };
            row.getCell('severity').font = { color: { argb: 'FFFFFFFF' }, bold: true };
        } else if (defect.severity === 'High') {
            row.getCell('severity').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEF4444' }
            };
            row.getCell('severity').font = { color: { argb: 'FFFFFFFF' } };
        } else if (defect.severity === 'Medium') {
            row.getCell('severity').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF59E0B' }
            };
            row.getCell('severity').font = { color: { argb: 'FFFFFFFF' } };
        }

        // Color code by status
        if (defect.status === 'Closed') {
            row.getCell('status').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B981' }
            };
            row.getCell('status').font = { color: { argb: 'FFFFFFFF' } };
        } else if (defect.status === 'Open') {
            row.getCell('status').fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEF4444' }
            };
            row.getCell('status').font = { color: { argb: 'FFFFFFFF' } };
        }
    });

    // Add Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary', { state: 'visible' });
    workbook.worksheets[1].orderNo = 0; // Move summary to first position

    // Summary Title
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = `Defect Report Summary - ${projectName}`;
    summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF6366F1' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 30;

    // Generated date
    summarySheet.mergeCells('A2:D2');
    summarySheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}`;
    summarySheet.getCell('A2').alignment = { horizontal: 'center' };
    summarySheet.getCell('A2').font = { italic: true };

    // Total defects
    summarySheet.getRow(4).height = 25;
    summarySheet.getCell('A4').value = 'Total Defects:';
    summarySheet.getCell('A4').font = { bold: true, size: 14 };
    summarySheet.getCell('B4').value = defects.length;
    summarySheet.getCell('B4').font = { bold: true, size: 14, color: { argb: 'FF6366F1' } };

    // By Severity
    const critical = defects.filter(d => d.severity === 'Critical').length;
    const high = defects.filter(d => d.severity === 'High').length;
    const medium = defects.filter(d => d.severity === 'Medium').length;
    const low = defects.filter(d => d.severity === 'Low').length;

    summarySheet.getCell('A6').value = 'By Severity';
    summarySheet.getCell('A6').font = { bold: true, size: 12 };
    summarySheet.getCell('A7').value = 'Critical:';
    summarySheet.getCell('B7').value = critical;
    summarySheet.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
    summarySheet.getCell('B7').font = { color: { argb: 'FFFFFFFF' }, bold: true };
    summarySheet.getCell('A8').value = 'High:';
    summarySheet.getCell('B8').value = high;
    summarySheet.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    summarySheet.getCell('B8').font = { color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A9').value = 'Medium:';
    summarySheet.getCell('B9').value = medium;
    summarySheet.getCell('B9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
    summarySheet.getCell('B9').font = { color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A10').value = 'Low:';
    summarySheet.getCell('B10').value = low;

    // By Status
    const open = defects.filter(d => d.status === 'Open').length;
    const inProgress = defects.filter(d => d.status === 'In Progress').length;
    const retest = defects.filter(d => d.status === 'Retest').length;
    const closed = defects.filter(d => d.status === 'Closed').length;

    summarySheet.getCell('A12').value = 'By Status';
    summarySheet.getCell('A12').font = { bold: true, size: 12 };
    summarySheet.getCell('A13').value = 'Open:';
    summarySheet.getCell('B13').value = open;
    summarySheet.getCell('B13').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
    summarySheet.getCell('B13').font = { color: { argb: 'FFFFFFFF' } };
    summarySheet.getCell('A14').value = 'In Progress:';
    summarySheet.getCell('B14').value = inProgress;
    summarySheet.getCell('A15').value = 'Retest:';
    summarySheet.getCell('B15').value = retest;
    summarySheet.getCell('A16').value = 'Closed:';
    summarySheet.getCell('B16').value = closed;
    summarySheet.getCell('B16').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    summarySheet.getCell('B16').font = { color: { argb: 'FFFFFFFF' } };

    // By Detection Source
    const detectionSources = {};
    defects.forEach(d => {
        const source = d.detection_source || 'Manual Testing';
        detectionSources[source] = (detectionSources[source] || 0) + 1;
    });

    summarySheet.getCell('A18').value = 'By Detection Source';
    summarySheet.getCell('A18').font = { bold: true, size: 12 };
    let row = 19;
    Object.entries(detectionSources).forEach(([source, count]) => {
        summarySheet.getCell(`A${row}`).value = `${source}:`;
        summarySheet.getCell(`B${row}`).value = count;
        row++;
    });

    // Set column widths for summary
    summarySheet.getColumn('A').width = 25;
    summarySheet.getColumn('B').width = 15;

    await workbook.xlsx.writeFile(outputPath);
    return outputPath;
};

module.exports = { generateDefectsExcel };
