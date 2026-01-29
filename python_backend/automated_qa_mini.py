import requests
import json
import time
import random
from datetime import datetime

API_URL = "http://localhost:8000/api/chat"

TEST_CASES = [
    {"q": "Hello", "type": "Greeting"},
    {"q": "Who are you?", "type": "Identity"},
    {"q": "Show me total inventory value", "type": "Inventory"},
    {"q": "What is the stock level of organic cotton t-shirt?", "type": "Inventory"},
    {"q": "Which items are low on stock?", "type": "Inventory"},
    {"q": "Show me yesterday's revenue", "type": "Sales"},
    {"q": "What is the best selling product?", "type": "Sales"},
    {"q": "Show me all employees", "type": "Resource"},
    {"q": "How much is our total payroll?", "type": "Resource"},
    {"q": "Analyze the business health", "type": "Strategic"},
]

def run_tests():
    results = []
    print(f"Starting Mini Quality Assurance Sweep: 10 Scenarios...")
    
    start_time = time.time()
    pass_count = 0
    fail_count = 0
    
    for i, test in enumerate(TEST_CASES):
        print(f"[{i+1}/10] Testing: {test['q']}")
        try:
            payload = {"query": test['q'], "history": []}
            r = requests.post(API_URL, json=payload, timeout=20)
            if r.status_code == 200:
                pass_count += 1
                status = "PASS"
                data = r.json()
                results.append({"id": i+1, "q": test['q'], "status": status, "latency": f"{r.elapsed.total_seconds():.2f}s", "source": data.get('source')})
            else:
                fail_count += 1
                results.append({"id": i+1, "q": test['q'], "status": f"FAIL ({r.status_code})", "latency": "N/A"})
        except Exception as e:
            fail_count += 1
            results.append({"id": i+1, "q": test['q'], "status": f"ERROR ({str(e)})", "latency": "N/A"})
            
    print("Mini Test Done.")
    return results

if __name__ == "__main__":
    res = run_tests()
    print(json.dumps(res, indent=2))
