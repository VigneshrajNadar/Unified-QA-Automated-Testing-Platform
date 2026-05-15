const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking defects in database...\n');

db.all('SELECT * FROM defects', [], (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
        return;
    }

    console.log(`✅ Found ${rows.length} defects in database\n`);

    if (rows.length > 0) {
        rows.forEach((defect, i) => {
            console.log(`Defect ${i + 1}:`);
            console.log(`  ID: ${defect.defect_id}`);
            console.log(`  Title: ${defect.title}`);
            console.log(`  Severity: ${defect.severity}`);
            console.log(`  Status: ${defect.status}`);
            console.log(`  Detection Source: ${defect.detection_source}`);
            console.log('');
        });
    } else {
        console.log('⚠️ No defects found! Run seed_demo.js first.');
    }

    db.close();
});
