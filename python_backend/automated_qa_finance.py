import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_financial_features():
    print(">>> Starting StoreAI Financial Regression Suite [v2.0]")
    print("-" * 50)
    
    scenarios = [
        {
            "name": "Daybook Integrity Check",
            "endpoint": "/finance/daybook",
            "method": "GET",
            "params": {"date": "2026-01-30"},
            "expected_status": 200
        },
        {
            "name": "Liability Aging Telemetry",
            "endpoint": "/finance/liability",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Financial Health Report Generation",
            "endpoint": "/finance/summary",
            "method": "GET",
            "expected_status": 200
        },
        {
            "name": "Recurring Expense Auto-Sync",
            "endpoint": "/finance/sync-expenses",
            "method": "POST",
            "expected_status": 200
        }
    ]

    results = []
    for s in scenarios:
        try:
            print(f"Testing: {s['name']}...", end=" ")
            if s['method'] == "GET":
                resp = requests.get(f"{BASE_URL}{s['endpoint']}", params=s.get('params'))
            else:
                resp = requests.post(f"{BASE_URL}{s['endpoint']}", json=s.get('body'))
            
            if resp.status_code == s['expected_status']:
                print("[PASS]")
                results.append(True)
            else:
                print(f"[FAIL] ({resp.status_code})")
                results.append(False)
        except Exception as e:
            print(f"[ERROR]: {e}")
            results.append(False)

    # AI Chatbot Financial Reasoning Test
    ai_scenarios = [
        "What is our current GST liability?",
        "Show me the aging analysis for sales payments.",
        "Calculate the refund for a damaged return on invoice INV-1001.",
        "Generate a Financial Health Report for today.",
        "How much are our recurring expenses for rent and electricity?"
    ]
    
    print("\n[AI] Testing AI Chatbot Financial Reasoning...")
    for query in ai_scenarios:
        try:
            print(f"Query: '{query}'...", end=" ")
            resp = requests.post(f"{BASE_URL}/chat", json={"query": query, "history": []})
            if resp.status_code == 200:
                data = resp.json()
                if data.get('response'):
                    print("[AI RESPONDED]")
                    results.append(True)
                else:
                    print("[EMPTY RESPONSE]")
                    results.append(False)
            else:
                print(f"[FAIL] ({resp.status_code})")
                results.append(False)
        except Exception as e:
            print(f"[ERROR]: {e}")
            results.append(False)

    total = len(results)
    passed = sum(results)
    print("\n" + "=" * 50)
    print(f"FINAL RESULT: {passed}/{total} Passed ({(passed/total)*100:.1f}%)")
    print("=" * 50)

if __name__ == "__main__":
    # Ensure server is running or this will fail
    test_financial_features()
