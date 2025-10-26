import requests
import json

url = 'http://127.0.0.1:5000/register'
payload = {
    'name': 'AutoTester',
    'phone': '9002223344',
    'aadhar': '987654321098',
    'password': 'testpass',
    'role': 'farmer',
    'email': 'autotest@example.com'
}

print('Posting to', url)
try:
    resp = requests.post(url, json=payload, timeout=10)
    print('Status:', resp.status_code)
    try:
        print('Response JSON:', resp.json())
    except Exception:
        print('Response text:', resp.text)
except Exception as e:
    print('Request error:', e)
