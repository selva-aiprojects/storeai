import requests
import jwt
import datetime
import os
from dotenv import load_dotenv

load_dotenv('main/.env')
JWT_SECRET = os.getenv("JWT_SECRET")

def test_auth():
    print(f"Secret: {JWT_SECRET}")
    
    # Generate token
    payload = {
        "id": "test",
        "email": "test@test.com",
        "role": "SUPER_ADMIN",
        "tenantId": "d648adeb-cb77-4678-912d-0a5f6122e5dd",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    print(f"Token: {token}")
    
    url = "http://localhost:8000/api/chat"
    headers = {"Authorization": f"Bearer {token}"}
    data = {"query": "test", "history": []}
    
    try:
        resp = requests.post(url, json=data, headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth()
