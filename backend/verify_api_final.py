import requests
import json

# Test API
resp = requests.get('http://127.0.0.1:5000/notifications/list?farmer_id=1')
data = resp.json()

print('API Test Result:')
print('Status:', resp.status_code)
print('Response format correct:', data.get('ok'))
print('Notifications count:', len(data.get('notifications', [])))

if data['notifications']:
    n = data['notifications'][0]
    print('\nFirst notification:')
    print(f"  contract_number: {n.get('contract_number')}")
    print(f"  farmer_total: {n.get('farmer_total')}")
    print(f"  farmer_total type: {type(n.get('farmer_total'))}")
    print(f"  farmer_total is None: {n.get('farmer_total') is None}")
    print(f"  farmer_total == 0: {n.get('farmer_total') == 0}")
    print(f"  farmer_total == '0': {n.get('farmer_total') == '0'}")
    
    print('\nAll fields:')
    for k, v in n.items():
        print(f"  {k}: {v}")
