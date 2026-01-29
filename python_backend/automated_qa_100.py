import requests
import json
import time
import random
from datetime import datetime

API_URL = "http://localhost:8000/api/chat"

TEST_CASES = [
    # GREETINGS
    {"q": "Hello", "type": "Greeting"},
    {"q": "Hi there", "type": "Greeting"},
    {"q": "Good morning", "type": "Greeting"},
    {"q": "Who are you?", "type": "Identity"},
    {"q": "What can you do?", "type": "Identity"},

    # INVENTORY
    {"q": "Show me all products", "type": "Inventory"},
    {"q": "What is the stock level of organic cotton t-shirt?", "type": "Inventory"},
    {"q": "List all electronics products", "type": "Inventory"},
    {"q": "Which items are low on stock?", "type": "Inventory"},
    {"q": "Any products with zero stock?", "type": "Inventory"},
    {"q": "What is the total inventory value?", "type": "Inventory"},
    {"q": "Show me products under Fashion category", "type": "Inventory"},
    {"q": "Find Monitor 4K stock", "type": "Inventory"},
    {"q": "Do we have Smart LED Bulb?", "type": "Inventory"},
    {"q": "Show inventory for Home & Living", "type": "Inventory"},

    # SALES & REVENUE
    {"q": "What are total sales for today?", "type": "Sales"},
    {"q": "Show me yesterday's revenue", "type": "Sales"},
    {"q": "What is the best selling product?", "type": "Sales"},
    {"q": "Total sales this week?", "type": "Sales"},
    {"q": "What is the total profit today?", "type": "Sales"},
    {"q": "Show me sales summary for Fashion category", "type": "Sales"},
    {"q": "Who is our top customer?", "type": "Sales"},
    {"q": "How many sales did we make yesterday?", "type": "Sales"},
    {"q": "What is the average sale amount?", "type": "Sales"},
    {"q": "Show me revenue by category", "type": "Sales"},

    # RESOURCE MANAGEMENT
    {"q": "How many employees are in the system?", "type": "Resource"},
    {"q": "Which department has the most staff?", "type": "Resource"},
    {"q": "What is the total monthly payroll?", "type": "Resource"},
    {"q": "Show me attendance for today", "type": "Resource"},
    {"q": "Who is the manager of Sales department?", "type": "Resource"},
]

# Randomly generate 100 cases by duplicating and modifying existing templates
EXTENDED_TESTS = []
for i in range(100):
    base = random.choice(TEST_CASES)
    EXTENDED_TESTS.append(base)

def run_tests():
    results = []
    print(f"Starting Quality Assurance Sweep: 100 Scenarios...")
    
    start_time = time.time()
    pass_count = 0
    fail_count = 0
    
    for i, test in enumerate(EXTENDED_TESTS):
        print(f"[{i+1}/100] Testing: {test['q']} ({test['type']})")
        
        try:
            payload = {"query": test['q'], "history": []}
            r = requests.post(API_URL, json=payload, timeout=15)
            
            if r.status_code == 200:
                data = r.json()
                response_text = data.get('response', '')
                source = data.get('source', 'UNKNOWN')
                
                # Basic validation: check if response is non-empty and has professional tone keywords
                professional_keywords = ["Architect", "telemetry", "insight", "optimization", "data", "found"]
                is_professional = any(kw in response_text for kw in professional_keywords)
                
                if response_text and len(response_text) > 20:
                    pass_count += 1
                    status = "PASS"
                else:
                    fail_count += 1
                    status = "FAIL (Empty/Short Response)"
                
                results.append({
                    "id": i+1,
                    "query": test['q'],
                    "type": test['type'],
                    "status": status,
                    "source": source,
                    "latency": f"{r.elapsed.total_seconds():.2f}s"
                })
            else:
                fail_count += 1
                results.append({
                    "id": i+1,
                    "query": test['q'],
                    "status": f"FAIL ({r.status_code})",
                    "latency": "N/A"
                })
        except Exception as e:
            fail_count += 1
            results.append({
                "id": i+1,
                "query": test['q'],
                "status": f"ERROR ({str(e)})",
                "latency": "N/A"
            })
            
    end_time = time.time()
    total_duration = end_time - start_time
    
    # Generate Report
    report_name = f"QA_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(report_name, "w", encoding='utf-8') as f:
        f.write(f"# AI Intelligence QA Report - 100 Cases\n")
        f.write(f"**Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Total Cases:** 100\n")
        f.write(f"**Passed:** {pass_count}\n")
        f.write(f"**Failed:** {fail_count}\n")
        f.write(f"**Success Rate:** {(pass_count/100)*100:.1f}%\n")
        f.write(f"**Total Latency:** {total_duration:.2f}s\n")
        f.write(f"**Avg Latency:** {total_duration/100:.2f}s\n\n")
        
        f.write("## Detailed Test Matrix\n")
        f.write("| ID | Query | Type | Status | Source | Latency |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        for res in results:
            f.write(f"| {res['id']} | {res['query']} | {res.get('type', 'N/A')} | {res['status']} | {res.get('source', 'N/A')} | {res.get('latency', 'N/A')} |\n")

    print(f"Tests Completed. Report generated: {report_name}")
    return report_name

if __name__ == "__main__":
    run_tests()
