
import asyncio
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.rag import rag_service

async def test():
    print("🚀 Starting RAG Verification...")
    try:
        # Initialize RAG
        await rag_service.init()
        
        # Test Query
        test_query = "hello"
        print(f"🔍 Testing query: '{test_query}'")
        
        res = await rag_service.process_query(test_query)
        
        print(f"✅ Response received")
        print(f"✅ Intent detected: {res.intent}")
        
        if hasattr(res, 'intent'):
            print("✨ SUCCESS: 'intent' attribute exists!")
        else:
            print("❌ FAILURE: 'intent' attribute missing!")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ ERROR during test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test())
