
import asyncio
from services.db import db
import json

async def check_stock():
    print("--- CATEGORY STOCK LEVELS ---")
    query = """
        SELECT c.name as category, SUM(p."stockQuantity") as total_stock 
        FROM "Product" p
        JOIN "Category" c ON p."categoryId" = c.id
        GROUP BY c.name
    """
    try:
        rows = await db.fetch_rows(query)
        results = []
        for row in rows:
            results.append({"category": row['category'], "stock": row['total_stock']})
            print(f"{row['category']}: {row['total_stock']}")
            
        with open('stock_verification.json', 'w') as f:
            json.dump(results, f, indent=2)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_stock())
