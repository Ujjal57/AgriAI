import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print('=== SQLite Database Status ===\n')

# Check contracts table
print('CONTRACTS TABLE:')
cur.execute("SELECT COUNT(*) FROM contracts")
count = cur.fetchone()[0]
print(f'  Row count: {count}')

if count > 0:
    # Show structure
    cur.execute('PRAGMA table_info(contracts)')
    cols = [c[1] for c in cur.fetchall()]
    print(f'  Columns: {cols}')
    
    # Show first row for farmer_id=1
    cur.execute('SELECT * FROM contracts WHERE farmer_id=1 LIMIT 1')
    row = cur.fetchone()
    if row:
        print(f'  Sample row (farmer_id=1): {dict(zip(cols, row))}')

# Check if we can see what the contract_b creation would look like
print('\nChecking MySQL connection...')
import sys
sys.path.insert(0, '/Users/Ujjal Kumar Dey/Desktop/AgriAI/backend')

# Check environment
import os
use_mysql = (os.environ.get('DB_USE', 'mysql').lower() == 'mysql')
print(f'  DB_USE env var: {os.environ.get("DB_USE", "mysql")} -> use_mysql={use_mysql}')

# Try MySQL connection
try:
    import mysql.connector
    print('  MySQL driver available: YES')
    
    cfg = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'agri_ai'),
    }
    print(f'  MySQL config: {cfg}')
    
    conn_mysql = mysql.connector.connect(**cfg)
    cur_mysql = conn_mysql.cursor()
    cur_mysql.execute("SHOW TABLES LIKE 'contract_b'")
    if cur_mysql.fetchone():
        print('  contract_b EXISTS in MySQL')
        # Check data
        cur_mysql.execute('SELECT COUNT(*) FROM contract_b')
        mysql_count = cur_mysql.fetchone()[0]
        print(f'  MySQL contract_b rows: {mysql_count}')
        
        # Show first row
        cur_mysql.execute('SELECT id, contract_number, farmer_id, farmer_total, status FROM contract_b LIMIT 1')
        mysql_row = cur_mysql.fetchone()
        if mysql_row:
            print(f'  Sample: {mysql_row}')
    else:
        print('  contract_b does NOT exist in MySQL')
    
    cur_mysql.close()
    conn_mysql.close()
except Exception as e:
    print(f'  MySQL connection failed: {e}')

conn.close()
