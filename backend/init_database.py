#!/usr/bin/env python3
"""Initialize the database with all required tables."""

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Create contracts table
    print("📋 Creating 'contracts' table...")
    cur.execute('''
        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_number TEXT NOT NULL,
            farmer_id INTEGER DEFAULT NULL,
            farmer_name TEXT DEFAULT NULL,
            farmer_address TEXT DEFAULT NULL,
            farmer_state TEXT DEFAULT NULL,
            buyer_id INTEGER DEFAULT NULL,
            buyer_name TEXT DEFAULT NULL,
            buyer_address TEXT DEFAULT NULL,
            buyer_state TEXT DEFAULT NULL,
            crop_name TEXT NOT NULL,
            variety TEXT DEFAULT NULL,
            quantity_kg REAL NOT NULL,
            price_per_kg REAL NOT NULL,
            amount REAL DEFAULT NULL,
            contract_nature TEXT DEFAULT 'post-harvest',
            contract_duration TEXT DEFAULT 'one-time',
            start_date DATE DEFAULT NULL,
            end_date DATE DEFAULT NULL,
            duration INTEGER DEFAULT 0,
            farmer_platform_fee REAL DEFAULT 0,
            farmer_gst REAL DEFAULT 0,
            buyer_platform_fee REAL DEFAULT 0,
            buyer_gst REAL DEFAULT 0,
            delivery_cost TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    print("✅ contracts table created successfully!")
    
    # List tables again
    print("\n📋 Tables in database after creation:")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    for table in cur.fetchall():
        cur.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cur.fetchone()[0]
        print(f"   - {table[0]} ({count} rows)")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
