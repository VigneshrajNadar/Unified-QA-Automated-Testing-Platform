const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Migrating Database: Adding monitor_id to api_test_results...');

db.serialize(() => {
    // 1. Add monitor_id column to api_test_results
    db.run(`ALTER TABLE api_test_results ADD COLUMN monitor_id INTEGER`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️ Column monitor_id already exists in api_test_results.');
            } else {
                console.error('❌ Error adding column:', err.message);
            }
        } else {
            console.log('✅ Added monitor_id column to api_test_results.');
        }
    });

    // 2. Add FOREIGN KEY constraint? SQLite ALTER TABLE is limited.
    // We can't easily add a FK constraint with ALTER TABLE.
    // Ideally we'd recreate the table, but for now just adding the column prevents the crash.
});

db.close();
