const db = require('./database');

const sql = `UPDATE users SET email = 'admin@example.com' WHERE email = 'admin@meghana.com'`;

db.run(sql, [], function (err) {
    if (err) {
        console.error('Error updating admin email:', err.message);
    } else {
        if (this.changes > 0) {
            console.log('✅ Updated admin email to admin@example.com');
        } else {
            // If update failed, maybe user doesn't exist or already updated. 
            // Let's try to insert if it doesn't exist, capable of handling unique constraint
            console.log('Admin email not found to update, relying on seed or manual entry.');
        }
    }
});
