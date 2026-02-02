import asyncio
import os
import sys

# Add python_backend to path
sys.path.append(os.path.join(os.getcwd(), 'python_backend'))

from services.rag import rag_service
from services.db import db

async def test_queries():
    await db.connect()
    
    # Use the Technova UUID from my previous inspection
    TENANT_ID = 'd648adeb-cb77-4678-912d-0a5f6122e5dd'
    
    queries = [
        "How many resources do we have?",
        "What is the resource allocation by department?",
        "Check stock levels for Enterprise Switch",
        "Show me all products",
        "What are the sales from yesterday?"
    ]
    
    for q in queries:
        print(f"\nQUERY: {q}")
        result = await rag_service.process_query(q, history=[], tenant_id=TENANT_ID)
        print(f"SOURCE: {result.source}")
        print(f"RESPONSE: {result.response}")
        print("-" * 50)
        
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_queries())
