const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateDefectReport } = require('./utils/pdfGenerator');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testing PDF Generation Logic...');

const query = `SELECT d.*, p.name as project_name, tc.title as test_case_title 
               FROM defects d 
               LEFT JOIN projects p ON d.project_id = p.project_id 
               LEFT JOIN test_cases tc ON d.test_case_id = tc.test_case_id
               ORDER BY d.defect_id DESC`;

db.all(query, [], async (err, defects) => {
    if (err) {
        console.error('❌ Database Query Error:', err);
        return;
    }

    console.log(`✅ Database returned ${defects.length} defects`);

    if (defects.length > 0) {
        console.log('Sample Defect:', {
            title: defects[0].title,
            project: defects[0].project_name,
            test_case: defects[0].test_case_title
        });
    }

    const outputPath = path.join(__dirname, 'test_report.pdf');

    try {
        console.log('📝 Generating PDF...');
        await generateDefectReport(defects, 'Test Project', outputPath);

        const stats = fs.statSync(outputPath);
        console.log(`✅ PDF Generated! Size: ${stats.size} bytes`);
        console.log(`📍 Location: ${outputPath}`);

        if (stats.size < 1000) {
            console.warn('⚠️ PDF seems suspiciously small!');
        } else {
            console.log('👍 PDF size looks reasonable.');
        }

    } catch (pdfErr) {
        console.error('❌ PDF Generation Error:', pdfErr);
    }
});
