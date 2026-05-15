const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

const resetPassword = async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    db.serialize(() => {
        // Update John
        db.run("UPDATE users SET password_hash = ? WHERE email = ?", [passwordHash, 'john@example.com'], function (err) {
            if (err) console.error(err);
            else console.log(`Updated John's password. Changes: ${this.changes}`);
        });

        // Update Admin
        db.run("UPDATE users SET password_hash = ? WHERE email = ?", [adminHash, 'admin@meghana.com'], function (err) {
            if (err) console.error(err);
            else console.log(`Updated Admin's password. Changes: ${this.changes}`);
        });

        // If John doesn't exist, insert him
        db.get("SELECT * FROM users WHERE email = ?", ['john@example.com'], (err, row) => {
            if (!row) {
                console.log('John not found, inserting...');
                db.run("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                    ['John Doe', 'john@example.com', passwordHash, 'Tester']);
            }
        });
    });
};

resetPassword();
