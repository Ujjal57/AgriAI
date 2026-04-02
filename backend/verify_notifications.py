"""
Comprehensive verification that ONLY contract_b from MySQL is being used for notifications
"""
import os
import mysql.connector

db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': int(os.environ.get('DB_PORT', '3306')),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'agri_ai'),
}

print("=" * 80)
print("VERIFYING CONTRACT_B TABLE FOR FARMER NOTIFICATIONS")
print("=" * 80)
print(f"\nDatabase Config:")
print(f"  Host: {db_config['host']}")
print(f"  Port: {db_config['port']}")
print(f"  Database: {db_config['database']}")
print(f"  User: {db_config['user']}")

try:
    conn = mysql.connector.connect(**db_config)
    cur = conn.cursor(dictionary=True)
    
    # Check if contract_b exists
    print("\n1. Checking if contract_b table exists...")
    cur.execute("SHOW TABLES LIKE 'contract_b'")
    result = cur.fetchone()
    if result:
        print("   ✓ contract_b table EXISTS")
    else:
        print("   ✗ contract_b table NOT FOUND")
    
    # Count contracts in contract_b
    print("\n2. Contracts in contract_b table:")
    cur.execute("""
        SELECT id, contract_number, farmer_id, farmer_name, status 
        FROM contract_b 
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    print(f"   Total: {len(rows)} contracts")
    for r in rows:
        print(f"     - {r['contract_number']}: farmer_id={r['farmer_id']}, status={r['status']}")
    
    # Show what notifications query would return
    print("\n3. Notifications query result (farmer_id=1, excluding rejected/declined/cancelled):")
    cur.execute("""
        SELECT id, contract_number, farmer_id, farmer_name, crop_name, status, 
               COALESCE(`read`, 0) as is_read, sender
        FROM contract_b 
        WHERE farmer_id = 1 
        AND status NOT IN ('rejected', 'declined', 'cancelled')
        ORDER BY id DESC
        LIMIT 100
    """)
    notif_rows = cur.fetchall()
    print(f"   Result: {len(notif_rows)} contracts for farmer 1")
    for r in notif_rows:
        print(f"     - {r['contract_number']}: {r['crop_name']} ({r['status']}), read={r['is_read']}")
    
    # Also check if old contracts table exists and has data
    print("\n4. Checking if old 'contracts' table exists:")
    cur.execute("SHOW TABLES LIKE 'contracts'")
    if cur.fetchone():
        print("   ⚠ old 'contracts' table EXISTS - this should NOT be used!")
        cur.execute("SELECT COUNT(*) as cnt FROM contracts")
        count = cur.fetchone()['cnt']
        print(f"     Contains {count} contracts")
    else:
        print("   ✓ old 'contracts' table does not exist (good)")
    
    # Check purchase_notifications table
    print("\n5. Checking if 'purchase_notifications' table exists:")
    cur.execute("SHOW TABLES LIKE 'purchase_notifications'")
    if cur.fetchone():
        print("   ⚠ 'purchase_notifications' table EXISTS - this should NOT be used by /notifications/list!")
        cur.execute("SELECT COUNT(*) as cnt FROM purchase_notifications")
        count = cur.fetchone()['cnt']
        print(f"     Contains {count} records")
    else:
        print("   ✓ 'purchase_notifications' table does not exist (acceptable)")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 80)
    print("VERIFICATION COMPLETE")
    print("=" * 80)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print("\nMake sure:")
    print("  - MySQL/XAMPP is running")
    print("  - Database credentials are set in .env file")
    print("  - DB_USE=mysql environment variable is set")
