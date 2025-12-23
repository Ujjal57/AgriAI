import requests

url='http://127.0.0.1:5000/login'
print('Posting to', url)
try:
    r=requests.post(url,json={'email':'autotest@example.com','password':'testpass'},timeout=5)
    print('status',r.status_code)
    try:
        print('json:',r.json())
    except Exception:
        print('text:',r.text)
except Exception as e:
    print('error',e)
