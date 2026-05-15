const db = require('./database');

console.log('Inspecting api_test_results schema...');

setTimeout(() => {
    db.all(`PRAGMA table_info(api_test_results)`, [], (err, rows) => {
        if (err) {
            console.error('Error getting schema:', err);
            return;
        }
        console.log('Columns:', JSON.stringify(rows.map(r => r.name)));

        // Try the query
        console.log('Testing query...');
        const sql = `
            SELECT r.*, req.name as request_name, req.method
            FROM api_test_results r
            JOIN api_requests req ON r.request_id = req.request_id
            WHERE r.monitor_id = 1
            ORDER BY r.executed_at DESC
            LIMIT 1
        `;
        db.all(sql, [], (err, rows) => {
            if (err) console.error('Query Failed:', err.message);
            else console.log('Query Succeeded. Rows:', rows.length);
        });
    });
}, 2000);
