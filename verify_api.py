
import requests
import json

try:
    url = "http://localhost:8000/api/chat"
    payload = {"query": "Which products expiring this month have the highest stock levels?"}
    headers = {"Content-Type": "application/json"}
    
    print(f"Testing API: {url}")
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("API Success!")
        print(f"Source: {data.get('source')}")
        print(f"Response: {data.get('response')}")
        # print(f"Context: {data.get('context')}") # Too long maybe
    else:
        print(f"API Failed: {response.status_code} - {response.text}")

except Exception as e:
    print(f"Connection Error: {e}")
