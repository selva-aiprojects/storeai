import requests
import json

try:
    print("Testing Root...")
    r = requests.get('http://localhost:8000/')
    print(r.status_code, r.text)

    print("\nTesting Chat (Vector)...")
    payload = {"query": "What products do we have?"}
    r = requests.post('http://localhost:8000/api/chat', json=payload)
    print(r.status_code)
    print(r.text[:200])

except Exception as e:
    print(e)
