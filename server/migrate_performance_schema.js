const db = require('./database');

console.log('Migrating database for Performance Testing...');

db.serialize(() => {
    // 1. Create perf_configs table (Saved Tests)
    db.run(`CREATE TABLE IF NOT EXISTS perf_configs (
        config_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        target_url TEXT NOT NULL,
        virtual_users INTEGER DEFAULT 10,
        duration_seconds INTEGER DEFAULT 30,
        ramp_up_seconds INTEGER DEFAULT 0,
        test_type TEXT DEFAULT 'load',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating perf_configs:', err.message);
        else console.log('✅ Created perf_configs table');
    });

    // 2. Create perf_results table (Run History)
    db.run(`CREATE TABLE IF NOT EXISTS perf_results (
        result_id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER,
        test_name TEXT,
        target_url TEXT,
        avg_response_time REAL,
        max_response_time REAL,
        throughput REAL,
        error_rate REAL,
        raw_data TEXT, 
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (config_id) REFERENCES perf_configs(config_id) ON DELETE SET NULL
    )`, (err) => {
        if (err) console.error('Error creating perf_results:', err.message);
        else console.log('✅ Created perf_results table');
    });
});
