import asyncio
import os
import sys
from dotenv import load_dotenv

# Add python_backend to path
sys.path.append(os.path.join(os.getcwd(), 'python_backend'))

from services.rag import rag_service
from services.db import db

async def main():
    await db.connect()
    
    TENANT_ID = 'd648adeb-cb77-4678-912d-0a5f6122e5dd' # storeai (Technova)
    
    query = "Check stock levels for Cisco Catalyst 9200L"
    print(f"\nQUERY: {query}")
    result = await rag_service.process_query(query, history=[], tenant_id=TENANT_ID)
    print(f"SOURCE: {result.source}")
    print(f"RESPONSE: {result.response}")
    
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
