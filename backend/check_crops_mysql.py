import os
import json
try:
    import mysql.connector
except Exception as e:
    print('mysql.connector not installed or import failed:', e)
    raise SystemExit(1)

cfg = {
    'host': os.environ.get('DB_HOST', '127.0.0.1'),
    'port': int(os.environ.get('DB_PORT', '3306')),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'agri_ai'),
}

print('Using DB config:', cfg)

try:
    cnx = mysql.connector.connect(**cfg)
    cur = cnx.cursor()
    cur.execute('SELECT id,seller_id,seller_name,seller_phone,crop_name,quantity_kg,price_per_kg,created_at FROM crops ORDER BY created_at DESC LIMIT 20')
    rows = cur.fetchall()
    print('Rows fetched:', len(rows))
    for r in rows:
        print(r)
    cur.close()
    cnx.close()
except Exception as e:
    print('MySQL query error:', e)
    raise
