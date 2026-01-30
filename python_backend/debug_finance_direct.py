import asyncio
import os
from services.finance import finance_service
from services.db import db

async def debug_daybook():
    try:
        print("Testing get_daybook('2026-01-30')...")
        res = await finance_service.get_daybook("2026-01-30")
        print(f"SUCCESS: Found {len(res)} rows.")
        if len(res) > 0:
            print(f"First row: {res[0]}")
    except Exception as e:
        import traceback
        print(f"FAILURE: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_daybook())
