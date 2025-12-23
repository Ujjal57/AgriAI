import os
import sys

print('Checking farmer table in configured DBs...')

# Try MySQL first
try:
    try:
        import mysql.connector as mysql
    except Exception:
        mysql = None
    if mysql is not None:
        cfg = {
            'host': os.environ.get('DB_HOST', 'localhost'),
            'port': int(os.environ.get('DB_PORT', '3306')),
            'user': os.environ.get('DB_USER', 'root'),
            'password': os.environ.get('DB_PASSWORD', ''),
            'database': os.environ.get('DB_NAME', 'agri_ai'),
        }
        conn = mysql.connect(**cfg)
        cur = conn.cursor()
        cur.execute('SELECT id,name,phone,email,aadhar,created_at FROM farmer ORDER BY created_at DESC LIMIT 50')
        rows = cur.fetchall()
        print('\nConnected to MySQL. Rows found in agri_ai.farmer:', len(rows))
        for r in rows:
            print(r)
        cur.close()
        conn.close()
        sys.exit(0)
    else:
        print('mysql.connector not available; will try SQLite fallback')
except Exception as e:
    print('MySQL query failed:', e)

# Fallback to SQLite
try:
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
    if not os.path.exists(db_path):
        print('\nSQLite fallback file not found:', db_path)
        sys.exit(0)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute('SELECT id,name,phone,email,aadhar,created_at FROM farmer ORDER BY created_at DESC LIMIT 50')
    rows = cur.fetchall()
    print('\nConnected to SQLite. Rows found in farmer table:', len(rows))
    for r in rows:
        print(r)
    cur.close()
    conn.close()
except Exception as e2:
    print('SQLite fallback query failed:', e2)
    sys.exit(1)
