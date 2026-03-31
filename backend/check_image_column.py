#!/usr/bin/env python
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

cfg = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', '3306')),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'agri_ai'),
}

try:
    conn = mysql.connector.connect(**cfg)
    cur = conn.cursor()
    
    # Check columns in crops table
    cur.execute('SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = %s AND TABLE_SCHEMA = %s', ('crops', cfg['database']))
    cols = [row[0] for row in cur.fetchall()]
    print('Columns in crops table:', cols)
    print('Has image_path column:', 'image_path' in cols)
    
    # If image_path doesn't exist, create it
    if 'image_path' not in cols:
        print('\nimage_path column MISSING! Adding it now...')
        cur.execute('ALTER TABLE crops ADD COLUMN image_path VARCHAR(255) DEFAULT NULL')
        conn.commit()
        print('✓ image_path column added successfully!')
    else:
        print('✓ image_path column already exists')
    
    cur.close()
    conn.close()
except Exception as e:
    print('Error:', str(e))
