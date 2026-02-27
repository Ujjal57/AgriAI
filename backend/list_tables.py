#!/usr/bin/env python3
"""List all tables in the SQLite database."""

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # List all tables
    print("📋 All tables in database:")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cur.fetchall()
    
    if not tables:
        print("   (no tables found)")
    else:
        for table in tables:
            table_name = table[0]
            cur.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cur.fetchone()[0]
            print(f"   - {table_name} ({count} rows)")
    
    # Check for contract-related tables
    print("\n🔍 Looking for contract-related tables:")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%contract%'")
    contract_tables = cur.fetchall()
    
    if contract_tables:
        for table in contract_tables:
            print(f"   ✅ Found: {table[0]}")
    else:
        print("   ❌ No contract tables found")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
