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
    
    print("BEFORE UPDATE:")
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name, sender FROM contracts ORDER BY id")
    for r in cur.fetchall():
        print(f"  ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, farmer: {r['farmer_name']}, sender: {r['sender']}")
    
    # Update all Ujjal Dey contracts with farmer_id=7 back to farmer_id=1
    print("\nUpdating contracts: farmer_id=7 → farmer_id=1 for Ujjal Dey...")
    cur.execute("""
        UPDATE contracts 
        SET farmer_id = 1 
        WHERE farmer_name LIKE '%Ujjal%' AND farmer_id = 7
    """)
    conn.commit()
    print(f"✓ Updated {cur.rowcount} contracts")
    
    print("\nAFTER UPDATE:")
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name, sender FROM contracts ORDER BY id")
    for r in cur.fetchall():
        print(f"  ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, farmer: {r['farmer_name']}, sender: {r['sender']}")
    
    print("\nCONTRACTS FOR FARMER_ID=1 WITH SENDER='buyer':")
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name, crop_name, sender FROM contracts WHERE farmer_id=1 AND sender='buyer'")
    rows = cur.fetchall()
    print(f"Found: {len(rows)} rows\n")
    for r in rows:
        print(f"  ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, crop: {r['crop_name']}, sender: {r['sender']}")
    
    cur.close()
    conn.close()
    print("\n✅ Successfully fixed farmer_id back to 1!")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
