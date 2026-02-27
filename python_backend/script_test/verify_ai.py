
import asyncio
import os
import sys

# Ensure the python_backend is in the path (parent directory)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from services.rag import rag_service

async def verify_ai():
    print("--- STARTING AI VERIFICATION ---")
    
    queries = [
        "Hello",
        "Yesterday Sales",
        "Stock Health",
        "Resource Allocation",
        "Who is the leader of UN security council?"
    ]
    
    for query in queries:
        print(f"\nQUERY: {query}")
        try:
            result = await rag_service.process_query(query, [])
            print(f"INTENT: {result.intent}")
            print(f"SOURCE: {result.source}")
            print(f"RESPONSE: {result.response}")
            
            if "[SERVICE SYNCHRONIZATION ERROR]" in result.response:
                 print("FAILED: Service returned sync error.")
            else:
                 print("SUCCESS: Intelligent response received.")
                 
        except Exception as e:
            print(f"ERROR processing query '{query}': {e}")

if __name__ == "__main__":
    asyncio.run(verify_ai())
