import asyncio
import os
from services.rag import rag_service
from services.db import db
from dotenv import load_dotenv

load_dotenv()

async def test_rag():
    await db.connect()
    try:
        tenant_id = "d648adeb-cb77-4678-912d-0a5f6122e5dd" # storeai
        query = "list the products"
        
        print(f"Testing RAG for tenant: {tenant_id}")
        result = await rag_service.process_query(query, [], tenant_id=tenant_id)
        
        print("\n--- RESPONSE ---")
        print(result.response)
        print("\n--- CONTEXT ---")
        print(result.context)
        print("\n--- SOURCE ---")
        print(result.source)

    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_rag())
