#!/usr/bin/env python3
"""Initialize all necessary database tables."""

import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'users.sqlite3')

tables_sql = [
    ('contracts', '''
        CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contract_number TEXT NOT NULL UNIQUE,
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
    '''),
    ('farmer', '''
        CREATE TABLE IF NOT EXISTS farmer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            phone TEXT,
            state TEXT,
            region TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    '''),
    ('buyer', '''
        CREATE TABLE IF NOT EXISTS buyer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            phone TEXT,
            state TEXT,
            region TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    '''),
]

try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    for table_name, create_sql in tables_sql:
        print(f"📋 Creating '{table_name}' table...")
        try:
            cur.execute(create_sql)
            conn.commit()
            print(f"   ✅ {table_name} table created/verified")
        except Exception as e:
            if 'already exists' in str(e):
                print(f"   ✓ {table_name} already exists")
            else:
                print(f"   ⚠️  {table_name}: {e}")
    
    # List final tables
    print("\n📋 Final database structure:")
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    for table in cur.fetchall():
        table_name = table[0]
        cur.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cur.fetchone()[0]
        print(f"   - {table_name} ({count} rows)")
    
    conn.close()
    print("\n✅ Database initialization complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
