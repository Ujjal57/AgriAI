#!/usr/bin/env python3
import mysql.connector
import os

try:
    cfg = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'port': int(os.environ.get('DB_PORT', '3306')),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'database': os.environ.get('DB_NAME', 'agri_ai'),
    }
    
    conn = mysql.connector.connect(**cfg)
    cur = conn.cursor(dictionary=True)
    
    # Check current data
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name FROM contracts WHERE farmer_name LIKE '%Ujjal%' LIMIT 5")
    print("Current contracts for Ujjal:")
    for r in cur.fetchall():
        print(f"  ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, farmer_name: {r['farmer_name']}")
    
    # Update contracts with farmer_id=1 to farmer_id=7 for Ujjal Dey
    cur.execute("""
        UPDATE contracts 
        SET farmer_id = 7 
        WHERE farmer_name LIKE '%Ujjal%' AND farmer_id = 1
    """)
    
    conn.commit()
    print(f"\nUpdated {cur.rowcount} contracts - farmer_id changed from 1 to 7")
    
    # Verify the update
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name, sender FROM contracts WHERE farmer_name LIKE '%Ujjal%' AND sender = 'buyer'")
    rows = cur.fetchall()
    print(f"\nContracts for Ujjal Dey with sender='buyer' after update:")
    for r in rows:
        print(f"  ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, sender: {r['sender']}")
    
    cur.close()
    conn.close()
    print("\n✅ Successfully fixed farmer_id mismatch!")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
