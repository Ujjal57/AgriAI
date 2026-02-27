#!/usr/bin/env python3
"""Insert sample contract data for testing."""

import sqlite3
import os
from datetime import datetime, timedelta

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # First, create sample farmer and buyer records if they don't exist
    print("📝 Creating test farmer and buyer...")
    
    # Insert farmer (Ujjal Kumar Dey)
    cur.execute(
        "INSERT OR IGNORE INTO farmer (id, name, email, state) VALUES (?, ?, ?, ?)",
        (1, "Ujjal Kumar Dey", "ujjal@example.com", "Karnataka")
    )
    
    # Insert buyer (buyer_id = 7)
    cur.execute(
        "INSERT OR IGNORE INTO buyer (id, name, email, state) VALUES (?, ?, ?, ?)",
        (7, "Ujjal Kumar Dey", "buyer@example.com", "Karnataka")
    )
    
    conn.commit()
    print("   ✅ Farmer and buyer records ready")
    
    # Insert the contract
    print("\n📋 Inserting contract CNT1772025822509...")
    
    contract_data = {
        'contract_number': 'CNT1772025822509',
        'farmer_id': 1,
        'farmer_name': 'Ujjal Kumar Dey',
        'farmer_address': 'Kogilu Cross / Karnataka',
        'farmer_state': 'Karnataka',
        'buyer_id': 7,
        'buyer_name': 'Ujjal Kumar Dey',
        'buyer_address': 'Kogilu Cross / Karnataka',
        'buyer_state': 'Karnataka',
        'crop_name': 'Apple',
        'variety': 'Maharaja variety',
        'quantity_kg': 1000.0,
        'price_per_kg': 100.0,
        'amount': 100000.0,
        'contract_nature': 'post-harvest',
        'contract_duration': 'one-time',
        'start_date': '2026-02-25',
        'end_date': '2026-03-31',
        'duration': 34,
        'farmer_platform_fee': 1800.0,
        'farmer_gst': 324.0,
    }
    
    try:
        cur.execute('''
            INSERT INTO contracts (
                contract_number, farmer_id, farmer_name, farmer_address, farmer_state,
                buyer_id, buyer_name, buyer_address, buyer_state,
                crop_name, variety, quantity_kg, price_per_kg, amount,
                contract_nature, contract_duration, start_date, end_date, duration,
                farmer_platform_fee, farmer_gst
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            contract_data['contract_number'],
            contract_data['farmer_id'],
            contract_data['farmer_name'],
            contract_data['farmer_address'],
            contract_data['farmer_state'],
            contract_data['buyer_id'],
            contract_data['buyer_name'],
            contract_data['buyer_address'],
            contract_data['buyer_state'],
            contract_data['crop_name'],
            contract_data['variety'],
            contract_data['quantity_kg'],
            contract_data['price_per_kg'],
            contract_data['amount'],
            contract_data['contract_nature'],
            contract_data['contract_duration'],
            contract_data['start_date'],
            contract_data['end_date'],
            contract_data['duration'],
            contract_data['farmer_platform_fee'],
            contract_data['farmer_gst'],
        ))
        conn.commit()
        print("   ✅ Contract inserted successfully!")
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            print(f"   ℹ️  Contract already exists (updating instead)...")
            # You could update here if needed
        else:
            raise
    
    # Verify the contract was inserted
    print("\n✅ Verifying contract in database...")
    cur.execute("SELECT * FROM contracts WHERE contract_number = ?", ('CNT1772025822509',))
    row = cur.fetchone()
    
    if row:
        cols = [description[0] for description in cur.description]
        contract = dict(zip(cols, row))
        print(f"   ✅ Contract found!")
        print(f"      - Contract#: {contract['contract_number']}")
        print(f"      - Farmer: {contract['farmer_name']} (ID: {contract['farmer_id']})")
        print(f"      - Buyer: {contract['buyer_name']} (ID: {contract['buyer_id']})")
        print(f"      - Crop: {contract['crop_name']} ({contract['variety']})")
        print(f"      - Amount: ₹{contract['amount']}")
        print(f"      - Quantity: {contract['quantity_kg']}kg @ ₹{contract['price_per_kg']}/kg")
    else:
        print("   ❌ Contract not found after insertion!")
    
    # Show total contracts
    cur.execute("SELECT COUNT(*) FROM contracts")
    total = cur.fetchone()[0]
    print(f"\n📈 Total contracts in database: {total}")
    
    conn.close()
    print("\n✅ Test data insertion complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
