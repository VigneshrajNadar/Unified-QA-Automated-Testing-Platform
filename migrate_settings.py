import sqlite3
import os

db_path = os.path.join('server', 'qa_tool.sqlite')
print(f"Migrating database at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(settings)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'rtm_strictness' not in columns:
        print("Adding rtm_strictness column...")
        cursor.execute("ALTER TABLE settings ADD COLUMN rtm_strictness TEXT DEFAULT 'Strict'")
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column rtm_strictness already exists.")
        
    conn.close()
except Exception as e:
    print(f"Migration failed: {e}")
