#!/usr/bin/env python3
"""Direct SQLite query to test if contract exists and show its details."""

import sqlite3
import os
import json

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')
print(f"📁 Database path: {db_path}")
print(f"✓ Database exists: {os.path.exists(db_path)}")

if not os.path.exists(db_path):
    print("❌ Database file not found!")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Check if contracts table exists
    print("\n📋 Checking if 'contracts' table exists...")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='contracts'")
    if cur.fetchone():
        print("✅ contracts table exists")
    else:
        print("❌ contracts table NOT found")
        exit(1)
    
    # List all columns in contracts table
    print("\n📐 Columns in contracts table:")
    cur.execute("PRAGMA table_info(contracts)")
    for col in cur.fetchall():
        print(f"   - {col[1]} ({col[2]})")
    
    # Try to find the specific contract
    contract_number = "CNT1772025822509"
    print(f"\n🔍 Searching for contract: {contract_number}")
    
    cur.execute("SELECT * FROM contracts WHERE contract_number = ?", (contract_number,))
    row = cur.fetchone()
    
    if row:
        print(f"✅ Contract FOUND!")
        cols = [description[0] for description in cur.description]
        contract_dict = dict(zip(cols, row))
        print("\n📄 Contract details:")
        for key, val in contract_dict.items():
            print(f"   {key}: {val}")
    else:
        print(f"❌ Contract NOT found with exact match")
        
        # Show first few contracts for comparison
        print("\n📊 First 10 contracts in database:")
        cur.execute("SELECT contract_number, farmer_id, crop_name, created_at FROM contracts LIMIT 10")
        cols = [description[0] for description in cur.description]
        for i, row in enumerate(cur.fetchall()):
            contract_dict = dict(zip(cols, row))
            print(f"   [{i+1}] {contract_dict.get('contract_number', 'N/A')} | farmer_id={contract_dict.get('farmer_id')} | {contract_dict.get('crop_name')} | {contract_dict.get('created_at')}")
        
        # Try case-insensitive search
        print(f"\n🔍 Searching with LIKE (case-insensitive):")
        cur.execute("SELECT contract_number FROM contracts WHERE LOWER(contract_number) = LOWER(?)", (contract_number,))
        result = cur.fetchone()
        if result:
            print(f"   ✅ Found with LIKE: {result[0]}")
        else:
            print(f"   ❌ Not found with LIKE either")
    
    # Count total contracts
    cur.execute("SELECT COUNT(*) FROM contracts")
    total = cur.fetchone()[0]
    print(f"\n📈 Total contracts in database: {total}")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
