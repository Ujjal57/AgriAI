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
    
    print("=== ALL CONTRACTS IN DATABASE ===\n")
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name, crop_name, buyer_id, buyer_name, sender FROM contracts ORDER BY id")
    for r in cur.fetchall():
        print(f"ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, farmer: {r['farmer_name']}, crop: {r['crop_name']}, buyer_id: {r['buyer_id']}, buyer: {r['buyer_name']}, sender: {r['sender']}")
    
    print("\n=== CONTRACTS WHERE farmer_id=7 AND sender='buyer' ===\n")
    cur.execute("SELECT id, contract_number, farmer_id, farmer_name, crop_name, sender FROM contracts WHERE farmer_id=7 AND sender='buyer'")
    rows = cur.fetchall()
    print(f"Found: {len(rows)} rows\n")
    for r in rows:
        print(f"  ID: {r['id']}, Contract#: {r['contract_number']}, farmer_id: {r['farmer_id']}, farmer: {r['farmer_name']}, crop: {r['crop_name']}, sender: {r['sender']}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
