import asyncio
from services.db import db
from datetime import datetime

async def check_inventory_docs():
    print("--- INVENTORY DOCUMENT CHECK ---")
    
    # 1. List recent InventoryDocuments
    docs = await db.fetch_rows('SELECT * FROM "InventoryDocument" LIMIT 10')
    print("\n[RECENT INVENTORY DOCUMENTS]")
    for doc in docs:
        print(f"ID: {doc['id']} | Type: {doc.get('type', 'N/A')} | Status: {doc.get('status', 'N/A')}")
        
    # 2. Check for items matching target SKUs
    target_skus = ['SW-001', 'SRV-001', 'NET-C9200', 'SRV-DL38D']
    for sku in target_skus:
        p_row = await db.fetch_rows('SELECT id, name FROM "Product" WHERE sku = $1', sku)
        if p_row:
            p = p_row[0]
            items = await db.fetch_rows('SELECT * FROM "InventoryDocumentItem" WHERE "productId" = $1', p['id'])
            print(f"\nSKU: {sku} | Name: {p['name']}")
            if items:
                for item in items:
                    print(f"  DocItem: {item.get('id')} | Qty: {item.get('quantity')} | DocID: {item.get('inventoryDocumentId')}")
            else:
                print("  No document items found.")

if __name__ == "__main__":
    asyncio.run(check_inventory_docs())
