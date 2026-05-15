const db = require('./database');

console.log('Adding missing columns to api_requests table...');

const columns = [
    { name: 'auth_type', type: 'TEXT' },
    { name: 'auth_value', type: 'TEXT' },
    { name: 'expected_status', type: 'INTEGER' },
    { name: 'schema', type: 'TEXT' },
    { name: 'description', type: 'TEXT' }
];

let completed = 0;

columns.forEach(col => {
    const sql = `ALTER TABLE api_requests ADD COLUMN ${col.name} ${col.type}`;

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
