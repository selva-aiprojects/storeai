import asyncio
import os
import sys

# Add python_backend to path
sys.path.append(os.path.join(os.getcwd(), 'python_backend'))

from services.llm import llm_service
from services.db import db

async def diagnose():
    print(">>> AI Intelligence Diagnostic Tool")
    
    # 1. Test LLM
    print("\n[1/3] Testing LLM (Groq)...")
    try:
        response = await llm_service.generate_response("Return exactly the word 'SUCCESS'")
        print(f"LLM Response: '{response}'")
        if response == "SUCCESS":
            print("LLM Check: PASS")
        else:
            print(f"LLM Check: FAIL (Unexpected response: {response})")
    except Exception as e:
        print(f"LLM Check: ERROR ({e})")

    # 2. Test Embedding
    print("\n[2/3] Testing Embedding (Gemini)...")
    try:
        embedding = await llm_service.get_embedding("Test query")
        if embedding and len(embedding) > 0:
            print(f"Embedding Check: PASS (Size: {len(embedding)})")
        else:
            print("Embedding Check: FAIL (Empty embedding)")
    except Exception as e:
        print(f"Embedding Check: ERROR ({e})")

    # 3. Test Database
    print("\n[3/3] Testing Database (Neon)...")
    try:
        await db.connect()
        # Use simple select
        result = await db.fetch_rows("SELECT 1 as val")
        print(f"Database Query Result: {result}")
        if result and result[0]['val'] == 1:
            print("Database Check: PASS")
        else:
            print("Database Check: FAIL (Unexpected result)")
        await db.disconnect()
    except Exception as e:
        print(f"Database Check: ERROR ({e})")

if __name__ == "__main__":
    asyncio.run(diagnose())
