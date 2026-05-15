import sqlite3
import os

db_path = os.path.join('server', 'qa_tool.sqlite')
print(f"Checking User 1 in: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if User 1 exists
    cursor.execute("SELECT user_id FROM users WHERE user_id = 1")
    user = cursor.fetchone()
    
    if not user:
        print("User 1 missing. Creating Mock Admin User...")
        cursor.execute("""
            INSERT INTO users (user_id, name, email, password_hash, role)
            VALUES (1, 'Admin User', 'admin@example.com', 'hashed_pass_placeholder', 'Admin')
        """)
        conn.commit()
        print("User 1 created successfully.")
    else:
        print("User 1 already exists.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
