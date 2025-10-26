# Dump recent rows from role tables (farmer, buyer, admin)
import os
try:
    import mysql.connector as mysql
except Exception:
    mysql = None

if mysql is None:
    print('mysql connector not available')
    raise SystemExit(1)

cfg = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', '3306')),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'agri_ai')
}
conn = mysql.connect(**cfg)
cur = conn.cursor()
for tbl in ('farmer','buyer','admin'):
    print('\nTABLE', tbl)
    try:
        cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash,created_at FROM {tbl} ORDER BY created_at DESC LIMIT 10")
        rows = cur.fetchall()
        if not rows:
            print('  no rows')
        for r in rows:
            print(' ', r)
    except Exception as e:
        print('  error', e)
cur.close(); conn.close()
