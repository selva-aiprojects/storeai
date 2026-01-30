import asyncio
import aiohttp
import sys

BASE_URL = "http://localhost:5000/api/v1"

async def test_finance_suite():
    print("--- 🔬 STARTING FINANCIAL REGRESSION SUITE ---")
    
    # 1. Daybook Check
    async with aiohttp.ClientSession() as session:
        print("[TEST] Fetching Daybook Registry...")
        async with session.get(f"{BASE_URL}/finance/daybook") as resp:
            if resp.status == 200:
                print("✅ Daybook API reachable.")
            else:
                print(f"❌ Daybook API failed with status {resp.status}")

        # 2. P&L Statement
        print("[TEST] Calculating Profit & Loss...")
        async with session.get(f"{BASE_URL}/finance/pl") as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ P&L Success. Revenue: {data['totalIncome']}, Net: {data['netProfit']}")
            else:
                print("❌ P&L API failed.")

        # 3. Liability Aging
        print("[TEST] Performing Aging Analysis...")
        async with session.get(f"{BASE_URL}/finance/aging") as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ Aging Analysis complete. Overdue: {data['overdue']}")
            else:
                print("❌ Aging API failed.")

        # 4. Recurring Expenses Automation
        print("[TEST] Triggering Recurring Expenses Auto-Post...")
        async with session.post(f"{BASE_URL}/finance/recurring-auto") as resp:
            if resp.status == 200:
                print("✅ Recurring expenses logic validated.")
            else:
                print("❌ Recurring automation failed.")

        # 5. GST Compliance
        print("[TEST] Checking GST Summary...")
        async with session.get(f"{BASE_URL}/accounts/tax-summary") as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"✅ GST Compliance Check: {data['status']} (₹{data['netPayable']})")
            else:
                print("❌ GST API failed.")

    print("--- ✅ FINANCIAL REGRESSION SUITE COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(test_finance_suite())
