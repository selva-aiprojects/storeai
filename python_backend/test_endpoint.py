
import requests
import sys

def test_chat(query="How much of stock we have for now?"):
    url = "http://localhost:8000/api/chat"
    payload = {
        "query": query,
        "history": []
    }
    try:
        print(f"Sending request for '{query}' to {url}...")
        resp = requests.post(url, json=payload, timeout=60)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:1000]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    q = "Stock Health"
    if len(sys.argv) > 1:
        q = " ".join(sys.argv[1:]) if sys.argv[1] != "--query" else sys.argv[2]
    test_chat(q)
