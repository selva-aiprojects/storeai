import requests
import json

API_BASE = 'http://localhost:5000/api/v1'

def verify():
    print('🔍 Verifying Node Financial Endpoints (Python)...')
    
    try:
        # Login
        login_payload = {
            'email': 'admin@storeai.com',
            'password': 'AdminPassword123!'
        }
        res = requests.post(f"{API_BASE}/auth/login", json=login_payload)
        res.raise_for_status()
        
        token = res.json().get('token')
        headers = {'Authorization': f"Bearer {token}"}
        
        print('✅ Login Successful')

        # 1. Balance Sheet
        bs_res = requests.get(f"{API_BASE}/finance/balance-sheet", headers=headers)
        bs_res.raise_for_status()
        print('📊 Balance Sheet Content Received')
        print(json.dumps(bs_res.json(), indent=2))

        # 2. Ledger fallback check
        ledger_res = requests.get(f"{API_BASE}/accounts/ledger", headers=headers)
        ledger_res.raise_for_status()
        entries = ledger_res.json()
        print(f"📜 Ledger Entries Found: {len(entries)}")
        
        if len(entries) > 0:
            print(f"   Sample Entry: {entries[0].get('title')}")

        print('✨ Verification Complete!')
    except Exception as e:
        print(f"❌ Verification Failed: {str(e)}")
        if hasattr(e, 'response') and e.response:
            print(f"   Error Detail: {e.response.text}")

if __name__ == "__main__":
    verify()
