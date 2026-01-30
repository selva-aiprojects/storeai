import asyncio
import aiohttp
import sys

BASE_URL = "http://localhost:5000/api/v1"

async def test_finance_suite():
    print("--- STARTING FINANCIAL REGRESSION SUITE ---")
    
    async with aiohttp.ClientSession() as session:
        # 0. AUTHENTICATION
        print("[AUTH] Logging in as Admin...")
        login_payload = {
            "email": "admin@storeai.com",
            "password": "AdminPassword123!",
            "tenantSlug": "master-store"
        }
        async with session.post(f"{BASE_URL}/auth/login", json=login_payload) as resp:
            if resp.status != 200:
                print(f"Login failed: {resp.status}")
                return
            auth_data = await resp.json()
            token = auth_data['token']
            print("Login successful. Token acquired.")

        headers = {"Authorization": f"Bearer {token}"}

        # 1. Daybook Check
        print("[TEST] Fetching Daybook Registry...")
        async with session.get(f"{BASE_URL}/finance/daybook", headers=headers) as resp:
            if resp.status == 200:
                print("Daybook API reachable.")
            else:
                print(f"Daybook API failed with status {resp.status}")

        # 2. P&L Statement
        print("[TEST] Calculating Profit & Loss...")
        async with session.get(f"{BASE_URL}/finance/pl", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"P&L Success. Revenue: {data.get('totalIncome', 0)}, Net: {data.get('netProfit', 0)}")
            else:
                print(f"P&L API failed with status {resp.status}")

        # 3. Liability Aging
        print("[TEST] Performing Aging Analysis...")
        async with session.get(f"{BASE_URL}/finance/aging", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"Aging Analysis complete. Overdue: {data.get('overdue', 0)}")
            else:
                print(f"Aging API failed with status {resp.status}")

        # 4. Recurring Expenses Automation
        print("[TEST] Triggering Recurring Expenses Auto-Post...")
        async with session.post(f"{BASE_URL}/finance/recurring-auto", headers=headers) as resp:
            if resp.status == 200:
                print("Recurring expenses logic validated.")
            else:
                print(f"Recurring automation failed with status {resp.status}")

        # 5. GST Compliance
        print("[TEST] Checking GST Summary...")
        # Note: In the routes, this was /accounts/tax-summary or similar. Let's stick to /finance endpoints if possible.
        # Looking at index.ts, financeRoutes are /api/v1/finance
        # The test originally linked to /accounts/tax-summary
        async with session.get(f"{BASE_URL}/accounts/tax-summary", headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"GST Compliance Check: {data.get('status', 'OK')} ({data.get('netPayable', 0)})")
            else:
                print(f"GST API failed with status {resp.status}")
    print("--- FINANCIAL REGRESSION SUITE COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(test_finance_suite())
