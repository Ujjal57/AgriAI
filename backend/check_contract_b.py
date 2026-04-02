import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check if contract_b table exists
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='contract_b'")
if cur.fetchone():
    print('=== contract_b TABLE EXISTS ===')
    # Get column info
    cur.execute('PRAGMA table_info(contract_b)')
    cols = cur.fetchall()
    print(f'Columns ({len(cols)}):')
    for c in cols:
        print(f'  {c[1]}: {c[2]}')
    
    # Get row count
    cur.execute('SELECT COUNT(*) FROM contract_b')
    count = cur.fetchone()[0]
    print(f'Row count: {count}')
    
    # Show rows where farmer_id=1
    cur.execute('SELECT id, contract_number, farmer_id, farmer_total, farmer_name, buyer_name, status FROM contract_b WHERE farmer_id=1 LIMIT 5')
    print('\nRows for farmer_id=1:')
    for row in cur.fetchall():
        print(f'  ID={row[0]}, CNT={row[1]}, farmer_total={row[2]}, farmer={row[3]}, buyer={row[4]}, status={row[5]}')
else:
    print('contract_b TABLE DOES NOT EXIST')
    # Check what tables exist
    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cur.fetchall()]
    print(f'Available tables: {tables}')

conn.close()
