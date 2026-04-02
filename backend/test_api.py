import requests
import json

# Test the /notifications/list endpoint
url = 'http://127.0.0.1:5000/notifications/list?farmer_id=1'

try:
    response = requests.get(url, timeout=5)
    print(f'Status: {response.status_code}')
    print(f'Response:')
    data = response.json()
    print(json.dumps(data, indent=2, default=str))
    
    if data.get('notifications'):
        print(f'\nFirst notification:')
        notif = data['notifications'][0]
        for key, val in notif.items():
            print(f'  {key}: {val}')
except Exception as e:
    print(f'Error: {e}')
