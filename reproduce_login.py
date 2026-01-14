import requests
import json

url = "http://localhost:3000/api/auth/login"
payload = {"username": "admin", "password": "admin"}
headers = {"Content-Type": "application/json"}

try:
    print(f"Testing Login API: {url}")
    response = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        with open('login_error.json', 'w') as f:
            json.dump(data, f, indent=2)
        print("Response saved to login_error.json")
    except:
        print("Response Text:", response.text)
        
except Exception as e:
    print(f"Request Failed: {e}")
