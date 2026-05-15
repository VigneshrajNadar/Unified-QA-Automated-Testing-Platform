const db = require('./database');

console.log('Migrating api_test_results table...');

const columns = [
    { name: 'response_time_ms', type: 'INTEGER' },
    { name: 'success', type: 'INTEGER' },
    { name: 'response_headers', type: 'TEXT' },
    { name: 'schema_valid', type: 'INTEGER' },
    { name: 'error_message', type: 'TEXT' }
];

let completed = 0;

columns.forEach(col => {
    const sql = `ALTER TABLE api_test_results ADD COLUMN ${col.name} ${col.type}`;

    db.run(sql, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`ℹ️  Column ${col.name} already exists`);
            } else {
                console.error(`❌ Error adding ${col.name}:`, err.message);
            }
        } else {
            console.log(`✅ Added column: ${col.name}`);
        }

        completed++;
        if (completed === columns.length) {
            console.log('\n✅ Migration complete!');
            process.exit(0);
        }
    });
});
