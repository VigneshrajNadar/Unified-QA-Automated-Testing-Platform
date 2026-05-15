const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'meghana.db'); // Adjust if database name/path defaults differently
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Adding test_type column to perf_results...");

    db.run("ALTER TABLE perf_results ADD COLUMN test_type TEXT DEFAULT 'load'", function (err) {
        if (err) {
            if (err.message.includes("duplicate column name")) {
                console.log("Column 'test_type' already exists.");
            } else {
                console.error("Error adding column:", err.message);
            }
        } else {
            console.log("Column 'test_type' added successfully.");
        }
    });
});

db.close();
