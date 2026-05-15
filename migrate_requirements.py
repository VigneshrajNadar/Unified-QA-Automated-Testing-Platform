import sqlite3
import os

db_path = os.path.join('server', 'qa_tool.sqlite')
print(f"Migrating Requirements Schema at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Add Columns to 'requirements'
    cursor.execute("PRAGMA table_info(requirements)")
    columns = [info[1] for info in cursor.fetchall()]
    
    new_cols = {
        'parent_id': 'INTEGER',
        'category': 'TEXT',
        'urgency': 'TEXT',
        'business_value': 'INTEGER',
        'author_id': 'INTEGER',
        'assigned_to': 'INTEGER'
    }
    
    for col, type_def in new_cols.items():
        if col not in columns:
            print(f"Adding column: {col}...")
            cursor.execute(f"ALTER TABLE requirements ADD COLUMN {col} {type_def}")
            
    # 2. Create 'requirement_versions' table
    print("Creating requirement_versions table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS requirement_versions (
            version_id INTEGER PRIMARY KEY AUTOINCREMENT,
            requirement_id INTEGER,
            version_number INTEGER,
            title TEXT,
            description TEXT,
            changed_by INTEGER,
            changed_at DATETIMEDEFAULT CURRENT_TIMESTAMP,
            change_reason TEXT,
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE
        )
    """)

    # 3. Create 'requirement_comments' table
    print("Creating requirement_comments table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS requirement_comments (
            comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            requirement_id INTEGER,
            user_id INTEGER,
            comment_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (requirement_id) REFERENCES requirements(requirement_id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    conn.commit()
    print("Migration completed successfully.")
    conn.close()

except Exception as e:
    print(f"Migration Failed: {e}")
