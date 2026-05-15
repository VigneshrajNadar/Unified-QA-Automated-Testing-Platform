const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

const reset = async () => {
    const johnHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);
    
    db.run("UPDATE users SET password_hash = ? WHERE email = ?", [johnHash, 'john@example.com'], function(err) {
        if (!err) console.log(`Updated john@example.com: ${this.changes} row(s)`);
    });
    
    db.run("UPDATE users SET password_hash = ? WHERE email = ?", [adminHash, 'admin@example.com'], function(err) {
        if (!err) console.log(`Updated admin@example.com: ${this.changes} row(s)`);
        db.close();
    });
};

reset();
