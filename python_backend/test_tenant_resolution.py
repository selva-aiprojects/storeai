import asyncio
from services.db import db
from services.rag import rag_service

async def test_tenant_resolution():
    print("=== Testing Tenant Resolution ===\n")
    
    # Check tenant slug resolution
    print(f"1. RAG tenant_slug: {rag_service.tenant_slug}")
    print(f"2. RAG tenant_id before resolution: {rag_service.tenant_id}")
    
    # Force resolution
    await rag_service._ensure_tenant_id()
    print(f"3. RAG tenant_id after resolution: {rag_service.tenant_id}\n")
    
    # Verify products exist for this tenant
    if rag_service.tenant_id:
        products = await db.fetch_rows(
            'SELECT COUNT(*) as cnt FROM "Product" WHERE "tenantId" = $1',
            rag_service.tenant_id
        )
        count = dict(products[0])['cnt']
        print(f"4. Products for resolved tenant UUID: {count}\n")
        
        # Check a sample product
        sample = await db.fetch_rows(
            'SELECT "name", "sku", "price" FROM "Product" WHERE "tenantId" = $1 LIMIT 1',
            rag_service.tenant_id
        )
        if sample:
            s = dict(sample[0])
            print(f"5. Sample product: {s['name']} ({s['sku']}) - ${s['price']}")

asyncio.run(test_tenant_resolution())
