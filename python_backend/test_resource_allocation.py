
import requests

def test_resource_allocation():
    url = "http://localhost:8000/api/chat"
    payload = {
        "query": "Resource Allocation",
        "history": []
    }
    try:
        print(f"Sending request for 'Resource Allocation' to {url}...")
        resp = requests.post(url, json=payload, timeout=60)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_resource_allocation()
