const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'qa_tool.sqlite');
const db = new sqlite3.Database(dbPath);

const seedUsers = async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    db.serialize(() => {
        // Check if users exist
        db.get("SELECT count(*) as count FROM users", [], (err, row) => {
            if (err) {
                console.error(err.message);
                return;
            }

            if (row.count === 0) {
                console.log('Seeding users...');
                const stmt = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");

                stmt.run('John Doe', 'john@example.com', passwordHash, 'Tester');
                stmt.run('Admin User', 'admin@meghana.com', adminHash, 'Admin');

                stmt.finalize();
                console.log('Users seeded successfully.');
                console.log('Tester: john@example.com / password123');
                console.log('Admin: admin@meghana.com / admin123');
            } else {
                console.log('Users already exist. Skipping seed.');
            }
        });
    });
};

seedUsers();
