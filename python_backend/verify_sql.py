import asyncio
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.rag import rag_service, IntentType
from services.llm import llm_service

async def verify_sql():
    print("--- Verifying SQL Handler ---")
    query = "What is available stock?"
    tenant_id = "storeai" 
    
    # Update service instance slug
    rag_service.tenant_slug = tenant_id
    rag_service.tenant_id = None # Force re-resolve
    
    # Ensure tenant resolved
    await rag_service._ensure_tenant_id()
    resolved_id = rag_service.tenant_id
    print(f"Tenant ID: {resolved_id}")

    try:
        print(f"Querying: '{query}'")
        # Direct call to SQL Handler
        result, source = await rag_service.sql_handler.execute(query, resolved_id)
        
        print("\n--- Result ---")
        if result:
            print(f"Source: {source}")
            print(f"Data Length: {len(result)}")
            print(f"Preview: {str(result)[:500]}")
        else:
            print("RESULT IS EMPTY/NONE")
            
    except Exception as e:
        print(f"CRITICAL SQL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_sql())
