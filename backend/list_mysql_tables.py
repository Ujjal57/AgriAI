# List databases, tables and counts for configured MySQL instance
import os
try:
    import mysql.connector as mysql
except Exception:
    mysql = None

if mysql is None:
    print('mysql.connector is not available in this Python environment.')
    raise SystemExit(1)

cfg = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', '3306')),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
}
print('Connecting with', cfg)
try:
    conn = mysql.connect(**cfg)
    cur = conn.cursor()
    cur.execute('SHOW DATABASES')
    dbs = [r[0] for r in cur.fetchall()]
    print('Databases:', dbs)
    db_name = os.environ.get('DB_NAME', 'agri_ai')
    print('Configured DB_NAME:', db_name)
    cur.execute(f"USE {db_name}")
    cur.execute('SHOW TABLES')
    tables = [r[0] for r in cur.fetchall()]
    print('Tables in', db_name, ':', tables)
    for t in ['farmer','buyer','admin','contacts']:
        if t in tables:
            cur.execute(f'SELECT COUNT(*) FROM {t}')
            c = cur.fetchone()[0]
            print(f'Table {t} row count:', c)
        else:
            print(f'Table {t} not present')
    cur.close(); conn.close()
except Exception as e:
    print('Error querying MySQL:', e)
    raise
