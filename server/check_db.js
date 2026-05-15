const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📊 Checking Database Contents...\n');

db.serialize(() => {
    db.all('SELECT COUNT(*) as count FROM projects', (err, rows) => {
        console.log('Projects:', rows[0].count);
    });

    db.all('SELECT COUNT(*) as count FROM test_cases', (err, rows) => {
        console.log('Test Cases:', rows[0].count);
    });

    db.all('SELECT COUNT(*) as count FROM test_runs', (err, rows) => {
        console.log('Test Runs:', rows[0].count);
    });

    db.all('SELECT COUNT(*) as count FROM defects', (err, rows) => {
        console.log('Defects:', rows[0].count);
    });

    db.all('SELECT COUNT(*) as count FROM requirements', (err, rows) => {
        console.log('Requirements:', rows[0].count);
    });

    db.all('SELECT * FROM projects', (err, rows) => {
        console.log('\n📁 Projects:');
        if (rows && rows.length > 0) {
            rows.forEach(p => console.log(`  - ${p.name} (ID: ${p.project_id})`));
        } else {
            console.log('  (empty)');
        }
    });

    db.all('SELECT * FROM test_cases LIMIT 5', (err, rows) => {
        console.log('\n📝 Test Cases (first 5):');
        if (rows && rows.length > 0) {
            rows.forEach(tc => console.log(`  - ${tc.title} (ID: ${tc.test_case_id})`));
        } else {
            console.log('  (empty)');
        }
        db.close();
    });
});
