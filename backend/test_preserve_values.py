import mysql.connector as mysql
try:
    conn = mysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='',
        database='agri_ai'
    )
    cur = conn.cursor()
    
    # Clean up test data
    cur.execute("DELETE FROM negotiate WHERE contract_number = 'TEST_PRESERVE'")
    conn.commit()
    
    # Test 1: Insert new negotiation with all fields
    print("Test 1: Insert new negotiation")
    cur.execute("""
        INSERT INTO negotiate (contract_number, sign_in, price, delivery_date) 
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            sign_in = VALUES(sign_in),
            price = VALUES(price),
            delivery_date = VALUES(delivery_date),
            updated_at = CURRENT_TIMESTAMP
    """, ('TEST_PRESERVE', 'farmer', 100.0, '2024-12-01'))
    conn.commit()
    
    cur.execute("SELECT * FROM negotiate WHERE contract_number = 'TEST_PRESERVE'")
    result = cur.fetchone()
    print(f"After insert: {result}")
    print()
    
    # Test 2: Update only price (should preserve delivery_date)
    print("Test 2: Update only price, preserve delivery_date")
    cur.execute("SELECT price, delivery_date, sign_in FROM negotiate WHERE contract_number = %s", ('TEST_PRESERVE',))
    existing = cur.fetchone()
    price, date, sign_in = existing
    
    new_price = 150.0
    final_price = new_price  # price is provided
    final_date = date  # date is NOT provided, keep existing
    final_sign_in = sign_in  # sign_in is NOT provided, keep existing
    
    cur.execute("""
        INSERT INTO negotiate (contract_number, sign_in, price, delivery_date) 
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            sign_in = %s,
            price = %s,
            delivery_date = %s,
            updated_at = CURRENT_TIMESTAMP
    """, ('TEST_PRESERVE', final_sign_in, final_price, final_date, final_sign_in, final_price, final_date))
    conn.commit()
    
    cur.execute("SELECT * FROM negotiate WHERE contract_number = 'TEST_PRESERVE'")
    result = cur.fetchone()
    print(f"After update (price only): {result}")
    print(f"Price changed: {result[3] == 150.0}, Date preserved: {result[4] == '2024-12-01'}")
    print()
    
    # Test 3: Update only date (should preserve price)
    print("Test 3: Update only date, preserve price")
    cur.execute("SELECT price, delivery_date, sign_in FROM negotiate WHERE contract_number = %s", ('TEST_PRESERVE',))
    existing = cur.fetchone()
    price, date, sign_in = existing
    
    new_date = '2024-12-15'
    final_price = price  # price is NOT provided, keep existing
    final_date = new_date  # date is provided
    final_sign_in = sign_in  # sign_in is NOT provided, keep existing
    
    cur.execute("""
        INSERT INTO negotiate (contract_number, sign_in, price, delivery_date) 
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE 
            sign_in = %s,
            price = %s,
            delivery_date = %s,
            updated_at = CURRENT_TIMESTAMP
    """, ('TEST_PRESERVE', final_sign_in, final_price, final_date, final_sign_in, final_price, final_date))
    conn.commit()
    
    cur.execute("SELECT * FROM negotiate WHERE contract_number = 'TEST_PRESERVE'")
    result = cur.fetchone()
    print(f"After update (date only): {result}")
    print(f"Price preserved: {result[3] == 150.0}, Date changed: {result[4] == '2024-12-15'}")
    
    conn.close()
    
except Exception as e:
    print(f'MySQL error: {e}')
    import traceback
    traceback.print_exc()
