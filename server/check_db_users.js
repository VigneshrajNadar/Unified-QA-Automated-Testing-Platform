const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT user_id, name, email, role FROM users", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(JSON.stringify(rows, null, 2));
    db.close();
});
