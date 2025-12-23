import requests
import json

# Adjust URL if your Flask server runs on a different host/port
URL = 'http://localhost:5000/cart/add'

payload = {
    'user_type': 'buyer',
    'user_id': 1,
    'user_phone': '9999999999',
    'items': [
        {
            'crop_id': 123,
            'crop_name': 'Test Crop',
            'variety': 'TestVar',
            'quantity_kg': 10,
            'price_per_kg': 50.0,
            'image_path': None
        }
    ]
}

print('Posting to', URL)
try:
    r = requests.post(URL, json=payload, timeout=10)
    print('Status:', r.status_code)
    try:
        print('Response JSON:', r.json())
    except Exception:
        print('Response text:', r.text)
except Exception as e:
    print('Request failed:', str(e))
