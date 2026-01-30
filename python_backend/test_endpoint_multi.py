
import requests

def test_chat_multi():
    url = "http://localhost:8000/api/chat"
    history = [
        {"role": "assistant", "content": "Greetings. I am your StoreAI Support Assistant..."},
        {"role": "user", "content": "Stock Health"},
        {"role": "assistant", "content": "Building on our discussion about 'Stock Health'..."}
    ]
    payload = {
        "query": "How much of stock we have for now?",
        "history": history
    }
    try:
        print(f"Sending multi-turn request to {url}...")
        resp = requests.post(url, json=payload, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat_multi()
