"""
StoreAI Intelligence Platform - Comprehensive E2E Test Suite
Tests all modules with synthetic data and validates workflows
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

BASE_URL = "http://localhost:8000"
RESULTS = []

class TestReporter:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
    
    def log(self, module: str, test: str, success: bool, message: str, duration_ms: float):
        status = "PASS" if success else "FAIL"
        self.results.append({
            "module": module,
            "test": test,
            "status": status,
            "message": message,
            "duration_ms": duration_ms
        })
        if success:
            self.passed += 1
            print(f"  ✓ {test} ({duration_ms:.0f}ms)")
        else:
            self.failed += 1
            print(f"  ✗ {test} - {message} ({duration_ms:.0f}ms)")
    
    def generate_report(self):
        total = self.passed + self.failed
        pass_rate = (self.passed / total * 100) if total > 0 else 0
        
        with open("E2E_TEST_REPORT.md", "w", encoding="utf-8") as f:
            f.write("# StoreAI Platform - End-to-End Test Report\n\n")
            f.write(f"**Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Summary\n\n")
            f.write(f"- **Total Tests:** {total}\n")
            f.write(f"- **Passed:** {self.passed}\n")
            f.write(f"- **Failed:** {self.failed}\n")
            f.write(f"- **Pass Rate:** {pass_rate:.1f}%\n\n")
            
            # Group by module
            modules = {}
            for result in self.results:
                mod = result["module"]
                if mod not in modules:
                    modules[mod] = []
                modules[mod].append(result)
            
            f.write("## Test Results by Module\n\n")
            for module, tests in modules.items():
                f.write(f"### {module}\n\n")
                f.write("| Test | Status | Details | Duration |\n")
                f.write("| :--- | :--- | :--- | ---: |\n")
                for t in tests:
                    f.write(f"| {t['test']} | {t['status']} | {t['message']} | {t['duration_ms']:.0f}ms |\n")
                f.write("\n")

reporter = TestReporter()

def api_call(method: str, endpoint: str, data=None, params=None) -> Tuple[bool, int, any]:
    """Make API call and return (success, status_code, response_data)"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            resp = requests.get(url, params=params)
        elif method == "POST":
            resp = requests.post(url, json=data)
        elif method == "PUT":
            resp = requests.put(url, json=data)
        elif method == "DELETE":
            resp = requests.delete(url)
        
        success = 200 <= resp.status_code < 300
        try:
            data = resp.json()
        except:
            data = resp.text
        
        return success, resp.status_code, data
    except Exception as e:
        return False, 0, str(e)

# ============================================================================
# AI INTELLIGENCE MODULE TESTS
# ============================================================================

def test_ai_intelligence():
    print("\n[AI INTELLIGENCE MODULE]")
    
    # Test 1: Greeting
    start = time.time()
    success, status, data = api_call("POST", "/api/chat", {
        "query": "Hello",
        "history": []
    })
    duration = (time.time() - start) * 1000
    
    if success and "StoreAI Intelligence Platform Assistant" in data.get("response", ""):
        reporter.log("AI Intelligence", "Greeting & Persona", True, "Correct persona response", duration)
    else:
        reporter.log("AI Intelligence", "Greeting & Persona", False, f"Status {status}", duration)
    
    # Test 2: Stock Query
    start = time.time()
    success, status, data = api_call("POST", "/api/chat", {
        "query": "Show me low stock products",
        "history": []
    })
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("AI Intelligence", "Stock Query", True, f"Source: {data.get('source')}", duration)
    else:
        reporter.log("AI Intelligence", "Stock Query", False, f"Status {status}", duration)
    
    # Test 3: Sales Query
    start = time.time()
    success, status, data = api_call("POST", "/api/chat", {
        "query": "What were yesterday's sales?",
        "history": []
    })
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("AI Intelligence", "Sales Query", True, f"Source: {data.get('source')}", duration)
    else:
        reporter.log("AI Intelligence", "Sales Query", False, f"Status {status}", duration)
    
    # Test 4: Telemetry Suppression
    start = time.time()
    success, status, data = api_call("POST", "/api/chat", {
        "query": "Tell me more",
        "history": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Greetings!"}
        ]
    })
    duration = (time.time() - start) * 1000
    
    if success and data.get("context") is None:
        reporter.log("AI Intelligence", "Telemetry Suppression", True, "Context correctly suppressed", duration)
    else:
        reporter.log("AI Intelligence", "Telemetry Suppression", False, "Context leaked", duration)

# ============================================================================
# FINANCE MODULE TESTS
# ============================================================================

def test_finance_module():
    print("\n[FINANCE MODULE]")
    
    # Test 1: Daybook Access
    start = time.time()
    success, status, data = api_call("GET", "/api/finance/daybook")
    duration = (time.time() - start) * 1000
    
    if success and isinstance(data, list):
        reporter.log("Finance", "Daybook Endpoint", True, f"{len(data)} records", duration)
    else:
        reporter.log("Finance", "Daybook Endpoint", False, f"Status {status}", duration)
    
    # Test 2: Financial Summary
    start = time.time()
    success, status, data = api_call("GET", "/api/finance/summary")
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("Finance", "Financial Summary", True, "Retrieved", duration)
    else:
        reporter.log("Finance", "Financial Summary", False, f"Status {status}: {data.get('detail', 'Unknown')[:50]}", duration)
    
    # Test 3: Liability Report
    start = time.time()
    success, status, data = api_call("GET", "/api/finance/liability")
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("Finance", "Liability Report", True, "Retrieved", duration)
    else:
        reporter.log("Finance", "Liability Report", False, f"Status {status}", duration)
    
    # Test 4: P&L Report
    start = time.time()
    success, status, data = api_call("GET", "/api/finance/pl")
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("Finance", "P&L Report", True, "Retrieved", duration)
    else:
        reporter.log("Finance", "P&L Report", False, f"Status {status}", duration)

# ============================================================================
# HR MODULE TESTS
# ============================================================================

def test_hr_module():
    print("\n[HR MODULE]")
    
    # Test 1: Employee List
    start = time.time()
    success, status, data = api_call("GET", "/api/hr/employees")
    duration = (time.time() - start) * 1000
    
    if success and isinstance(data, list):
        reporter.log("HR", "Employee List", True, f"{len(data)} employees", duration)
    else:
        reporter.log("HR", "Employee List", False, f"Status {status}: {str(data)[:50]}", duration)
    
    # Test 2: Attendance Report
    start = time.time()
    success, status, data = api_call("GET", "/api/hr/attendance/report", params={
        "month": 1,
        "year": 2026
    })
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("HR", "Attendance Report", True, "Retrieved for Jan 2026", duration)
    else:
        reporter.log("HR", "Attendance Report", False, f"Status {status}", duration)

# ============================================================================
# CONNECTIVITY TESTS
# ============================================================================

def test_connectivity():
    print("\n[CONNECTIVITY]")
    
    # Test root endpoint
    start = time.time()
    success, status, data = api_call("GET", "/")
    duration = (time.time() - start) * 1000
    
    if success:
        reporter.log("Connectivity", "Root Endpoint", True, data.get("status", "OK"), duration)
    else:
        reporter.log("Connectivity", "Root Endpoint", False, f"Status {status}", duration)

# ============================================================================
# MAIN RUNNER
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("STOREAI PLATFORM - END-TO-END TEST SUITE")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Run all test modules
    test_connectivity()
    test_ai_intelligence()
    test_finance_module()
    test_hr_module()
    
    print("\n" + "=" * 70)
    print(f"RESULTS: {reporter.passed}/{reporter.passed + reporter.failed} PASSED")
    print("=" * 70)
    
    # Generate detailed report
    reporter.generate_report()
    print(f"\nDetailed report saved to E2E_TEST_REPORT.md")
