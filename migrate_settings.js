const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Running migration on:', dbPath);

db.serialize(() => {
    db.run(`ALTER TABLE settings ADD COLUMN rtm_strictness TEXT DEFAULT 'Strict'`, (err) => {
        if (err && err.message.includes('duplicate column name')) {
            console.log('Column rtm_strictness already exists.');
        } else if (err) {
            console.error('Error adding column:', err.message);
        } else {
            console.log('Successfully added rtm_strictness column.');
        }
    });
});

db.close();
