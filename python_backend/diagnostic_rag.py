import asyncio
import json
from services.rag import rag_service
from services.db import db
import os

async def diag():
    print("--- Starting RAG Diagnostic ---")
    query = "Resource Allocation"
    history = []
    
    try:
        print(f"Testing Query: {query}")
        result = await rag_service.process_query(query, history)
        print("--- Result ---")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print("!!! CRASH DETECTED !!!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    asyncio.run(diag())
