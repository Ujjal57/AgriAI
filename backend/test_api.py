#!/usr/bin/env python3
"""Test the contract API endpoints."""

import requests
import json
import time
import subprocess
import os
import signal

# Start the Flask backend
print("🚀 Starting Flask backend...")
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Start Flask in background
process = subprocess.Popen(
    ['python', 'app.py'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

print("⏳ Waiting for Flask to start...")
time.sleep(5)

try:
    # Test the API endpoints
    base_url = "http://localhost:5000"
    contract_number = "CNT1772025822509"
    farmer_id = 1
    
    print("\n" + "="*60)
    print("🧪 TESTING CONTRACT API ENDPOINTS")
    print("="*60)
    
    # Test 1: /contracts/get/<contract_number>
    print(f"\n1️⃣ Testing GET /contracts/get/{contract_number}")
    print(f"   URL: {base_url}/contracts/get/{contract_number}")
    try:
        response = requests.get(f"{base_url}/contracts/get/{contract_number}", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.ok:
            data = response.json()
            print(f"   ✅ SUCCESS - Contract found!")
            if data.get('contract'):
                contract = data['contract']
                print(f"      - Contract#: {contract.get('contract_number')}")
                print(f"      - Farmer: {contract.get('farmer_name')}")
                print(f"      - Amount: ₹{contract.get('amount')}")
        else:
            print(f"   ❌ FAILED - {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test 2: /farmer/contracts?farmer_id=1
    print(f"\n2️⃣ Testing GET /farmer/contracts?farmer_id={farmer_id}")
    print(f"   URL: {base_url}/farmer/contracts?farmer_id={farmer_id}")
    try:
        response = requests.get(f"{base_url}/farmer/contracts?farmer_id={farmer_id}", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.ok:
            data = response.json()
            contracts = data.get('contracts', [])
            print(f"   ✅ SUCCESS - Found {len(contracts)} contract(s)")
            for i, contract in enumerate(contracts, 1):
                print(f"      [{i}] {contract.get('contract_number')} | {contract.get('farmer_name')} | ₹{contract.get('total_amount')}")
        else:
            print(f"   ❌ FAILED - {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test 3: /contracts/debug/1
    print(f"\n3️⃣ Testing GET /contracts/debug/{farmer_id}")
    print(f"   URL: {base_url}/contracts/debug/{farmer_id}")
    try:
        response = requests.get(f"{base_url}/contracts/debug/{farmer_id}", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.ok:
            data = response.json()
            contracts = data.get('contracts', [])
            print(f"   ✅ SUCCESS - Found {len(contracts)} contract(s)")
            for i, contract in enumerate(contracts, 1):
                print(f"      [{i}] {contract.get('contract_number')}")
        else:
            print(f"   ❌ FAILED - {response.text}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    print("\n" + "="*60)
    print("✅ API TESTING COMPLETE")
    print("="*60)
    
finally:
    # Kill the Flask process
    print("\n🛑 Stopping Flask backend...")
    process.terminate()
    process.wait(timeout=5)
    print("✅ Flask stopped")
