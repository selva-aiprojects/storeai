import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_ai_health_report():
    query = "Generate a Financial Health Report for today."
    print(f"Testing AI Query: '{query}'")
    try:
        resp = requests.post(f"{BASE_URL}/chat", json={"query": query, "history": []})
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print("Response:", resp.json().get('response')[:100] + "...")
        else:
            print("Error Detail:", resp.text)
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_ai_health_report()
