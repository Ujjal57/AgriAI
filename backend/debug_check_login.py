# Debug script to inspect stored user rows and test bcrypt verification
# Usage: python backend/debug_check_login.py
import os
import sys
email = 'autotest@example.com'
password = 'testpass'

print('Debug check for', email)

# Try MySQL first
try:
    import mysql.connector as mysql
    has_mysql = True
except Exception:
    has_mysql = False

import sqlite3
import bcrypt

found_any = False

if has_mysql:
    cfg = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'agri_ai')
    }
    try:
        conn = mysql.connect(**cfg)
        cur = conn.cursor()
        print('Connected to MySQL with', cfg['user'], '@', cfg['host'])
        for tbl in ('farmer', 'buyer', 'admin'):
            try:
                cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash FROM {tbl} WHERE email=%s LIMIT 1", (email,))
                row = cur.fetchone()
            except Exception as e:
                print('Query error for table', tbl, e)
                row = None
            print(tbl, '=>', row)
            if row:
                found_any = True
                stored = row[5]
                print('stored type:', type(stored))
                print('stored repr:', repr(stored)[:200])
                try:
                    if isinstance(stored, str):
                        stored_bytes = stored.encode('utf-8')
                    else:
                        stored_bytes = stored
                    ok = bcrypt.checkpw(password.encode('utf-8'), stored_bytes)
                except Exception as e:
                    ok = f'bcrypt error: {e}'
                print('bcrypt match:', ok)
        cur.close(); conn.close()
    except Exception as e:
        print('Could not connect to MySQL or query:', e)

# Fallback to sqlite
sqlite_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
if os.path.exists(sqlite_path):
    try:
        conn = sqlite3.connect(sqlite_path)
        cur = conn.cursor()
        print('Connected to SQLite at', sqlite_path)
        for tbl in ('farmer', 'buyer', 'admin'):
            try:
                cur.execute(f"SELECT id,name,phone,email,aadhar,password_hash FROM {tbl} WHERE email=? LIMIT 1", (email,))
                row = cur.fetchone()
            except Exception as e:
                print('SQLite query error for', tbl, e)
                row = None
            print(tbl, '=>', row)
            if row:
                found_any = True
                stored = row[5]
                print('stored type:', type(stored))
                print('stored repr:', repr(stored)[:200])
                try:
                    stored_bytes = stored.encode('utf-8') if isinstance(stored, str) else stored
                    ok = bcrypt.checkpw(password.encode('utf-8'), stored_bytes)
                except Exception as e:
                    ok = f'bcrypt error: {e}'
                print('bcrypt match:', ok)
        cur.close(); conn.close()
    except Exception as e:
        print('Could not open sqlite db:', e)
else:
    print('No sqlite fallback file at', sqlite_path)

if not found_any:
    print('No user rows found with email', email)

print('Done')
