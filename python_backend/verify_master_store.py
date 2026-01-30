
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def ask_ai(question, tenant_id="technova"):
    print(f"\n❓ Question: {question}")
    response = requests.post(f"{BASE_URL}/api/chat", json={
        "query": question,
        "history": []
    })
    if response.status_code == 200:
        data = response.json()
        print(f"🤖 AI: {data['response']}")
        return data['response']
    else:
        print(f"❌ Error {response.status_code}: {response.text}")
        return ""

def verify():
    print("🚀 Starting Targeted AI Verification for Master Store (technova)...")
    
    # Test 1: Capital Investment
    q1 = "How much was the initial capital investment?"
    res1 = ask_ai(q1)
    if "100,000" in res1 or "100000" in res1:
        print("✅ Capital Investment Grounding: PASS")
    else:
        print("❌ Capital Investment Grounding: FAIL")

    # Test 2: Procurement
    q2 = "List the total value of purchase orders from Apex Logistics."
    res2 = ask_ai(q2)
    if "59,000" in res2 or "50,000" in res2:
        print("✅ Procurement Grounding: PASS")
    else:
        print("❌ Procurement Grounding: FAIL")

    # Test 3: Profitability (Revenue - COGS)
    q3 = "What is our current net profit based on sales and cost of goods sold?"
    res3 = ask_ai(q3)
    # Expected: $7,500 (57,500 - 50,000)
    if "7,500" in res3 or "7500" in res3:
        print("✅ Profitability Grounding: PASS")
    else:
        print("❌ Profitability Grounding: FAIL (Note: AI might need specific wording or broader analysis)")

if __name__ == "__main__":
    verify()
