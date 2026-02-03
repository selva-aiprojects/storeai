
import asyncio
from services.db import db
import json

async def list_products():
    print("--- ACTUAL PRODUCT DATA ---")
    query = 'SELECT name, "stockQuantity", price FROM "Product"'
    try:
        rows = await db.fetch_rows(query)
        for row in rows:
            print(f"Name: {row['name']} | Stock: {row['stockQuantity']} | Price: {row['price']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_products())
