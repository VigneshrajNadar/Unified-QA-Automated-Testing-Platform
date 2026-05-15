const db = require('./database');

console.log('Migrating database for API Monitors...');

db.serialize(() => {
    // 1. Create api_monitors table
    db.run(`CREATE TABLE IF NOT EXISTS api_monitors (
        monitor_id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        name TEXT,
        frequency_cron TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_run DATETIME,
        next_run DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES api_collections(collection_id) ON DELETE CASCADE
    )`, (err) => {
        if (err) console.error('Error creating api_monitors:', err.message);
        else console.log('✅ Created api_monitors table');
    });

    // 2. Add monitor_id to api_test_results
    db.run(`ALTER TABLE api_test_results ADD COLUMN monitor_id INTEGER`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log('ℹ️  monitor_id column already exists');
            } else {
                console.error('Error adding monitor_id:', err.message);
            }
        } else {
            console.log('✅ Added monitor_id to api_test_results');
        }
    });
});
