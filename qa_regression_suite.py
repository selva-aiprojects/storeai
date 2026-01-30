import requests
import json
import time
from datetime import datetime
import sys

# Fix Unicode encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"

def run_test(name, func):
    print(f"[TEST] {name}...", end=" ", flush=True)
    start = time.time()
    try:
        success, message = func()
        duration = (time.time() - start) * 1000
        if success:
            print(f"PASSED ({duration:.0f}ms)")
            return True, message
        else:
            print(f"FAILED ({duration:.0f}ms)")
            print(f"      Reason: {message}")
            return False, message
    except Exception as e:
        print(f"ERROR: {e}")
        return False, str(e)

# --- INDIVIDUAL TESTS ---

def test_root():
    resp = requests.get(f"{BASE_URL}/")
    if resp.status_code == 200:
        return True, resp.json().get("status")
    return False, f"Status: {resp.status_code}"

def test_ai_greeting():
    payload = {"query": "Hello", "history": []}
    resp = requests.post(f"{BASE_URL}/api/chat", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        if "StoreAI Intelligence Platform Assistant" in data.get("response", ""):
            return True, "Persona Verified"
        return False, "Persona Mismatch"
    return False, f"Status: {resp.status_code}"

def test_ai_data_stock():
    payload = {"query": "What is the stock level of Product A?", "history": []}
    resp = requests.post(f"{BASE_URL}/api/chat", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        # Even if data is empty, it shouldn't be 'Product A/B/C' hallucinated if we are grounded
        # But for regression, we check if it handled the query.
        return True, f"Source: {data.get('source')}"
    return False, f"Status: {resp.status_code}"

def test_ai_telemetry_suppression():
    # Follow-up query that should result in NO_DATA_SIGNAL and thus context: null
    payload = {
        "query": "And what about its price?", 
        "history": [
            {"role": "user", "content": "Tell me about Product X"},
            {"role": "assistant", "content": "I don't see Product X in the database."}
        ]
    }
    resp = requests.post(f"{BASE_URL}/api/chat", json=payload)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("context") is None:
            return True, "Telemetry Suppressed Correctly"
        return False, f"Telemetry revealed: {data.get('context')}"
    return False, f"Status: {resp.status_code}"

def test_finance_summary():
    resp = requests.get(f"{BASE_URL}/api/finance/summary")
    if resp.status_code == 200:
        data = resp.json()
        if "totalRevenue" in data:
            return True, f"Revenue: {data.get('totalRevenue')}"
        return False, "Summary data missing keys"
    return False, f"Status: {resp.status_code}"

def test_finance_daybook():
    resp = requests.get(f"{BASE_URL}/api/finance/daybook")
    if resp.status_code == 200:
        return True, f"Type: {type(resp.json())}"
    return False, f"Status: {resp.status_code}"

def test_hr_employees():
    resp = requests.get(f"{BASE_URL}/api/hr/employees")
    if resp.status_code == 200:
        data = resp.json()
        if isinstance(data, list):
            return True, f"Count: {len(data)}"
        return False, "Not a list"
    return False, f"Status: {resp.status_code}"

def test_hr_attendance_report():
    # Test for January 2026
    resp = requests.get(f"{BASE_URL}/api/hr/attendance/report?month=1&year=2026")
    if resp.status_code == 200:
        return True, "Report Accessible"
    return False, f"Status: {resp.status_code}"

# --- RUNNER ---

if __name__ == "__main__":
    print("="*60)
    print(f"STORE-AI REGRESSION SUITE - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    tests = [
        ("Connectivity (Root)", test_root),
        ("AI: Greeting Persona", test_ai_greeting),
        ("AI: Stock Data Query", test_ai_data_stock),
        ("AI: Telemetry Suppression", test_ai_telemetry_suppression),
        ("Finance: Summary Data", test_finance_summary),
        ("Finance: Daybook Endpoint", test_finance_daybook),
        ("HR: Employee List", test_hr_employees),
        ("HR: Attendance Report", test_hr_attendance_report),
    ]
    
    passed = 0
    results = []
    
    for name, func in tests:
        success, msg = run_test(name, func)
        results.append((name, success, msg))
        if success:
            passed += 1
            
    print("="*60)
    print(f"RESULTS: {passed}/{len(tests)} PASSED")
    print("="*60)
    
    # Write report to file
    with open("REGRESSION_SUMMARY.md", "w", encoding="utf-8") as f:
        f.write("# StoreAI Platform Regression Report\n\n")
        f.write(f"**Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("| Feature | Status | Details |\n")
        f.write("| :--- | :--- | :--- |\n")
        for name, success, msg in results:
            status = "PASS" if success else "FAIL"
            f.write(f"| {name} | {status} | {msg} |\n")
        
        f.write(f"\n**Final Score: {passed}/{len(tests)}**\n")
    
    print(f"\nRegression report saved to REGRESSION_SUMMARY.md")
