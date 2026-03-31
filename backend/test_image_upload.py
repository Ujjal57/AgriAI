#!/usr/bin/env python
"""Test image upload to XAMPP database"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

# Use a test image from the uploads directory
test_image_path = 'c:\\Users\\Ujjal Kumar Dey\\Desktop\\AgriAI\\backend\\uploads\\fresh-basmati-rice-500x500.webp'

# Prepare the form data
data = {
    'seller_name': 'Test Farmer',
    'seller_phone': '9999999999',
    'seller_email': 'test@agritest.com',
    'region': 'Test Region',
    'state': 'Test State',
    'category': 'cereals',
    'crop_name': 'Test Basmati Rice',
    'variety': 'Premium',
    'quantity_kg': '100',
    'price_per_kg': '85.50',
    'expiry_date': '2026-12-31'
}

# Open the test image file
with open(test_image_path, 'rb') as f:
    files = {'image': f}
    
    # Send POST request to backend
    api_url = 'http://localhost:5000/my-crops'
    print(f'Sending image upload to {api_url}')
    print(f'Image file: {test_image_path}')
    
    try:
        response = requests.post(api_url, data=data, files=files)
        print(f'\nStatus Code: {response.status_code}')
        print(f'Response: {response.json()}')
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                print('\n✓ Image uploaded successfully!')
                print(f'Stored in: {result.get("stored")}')
            else:
                print(f'\n✗ Upload failed: {result.get("error", "Unknown error")}')
        else:
            print(f'\n✗ Request failed with status {response.status_code}')
    except Exception as e:
        print(f'Error: {str(e)}')
