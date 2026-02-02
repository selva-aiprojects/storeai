
import asyncio
from services.rag import RAGService

async def test_knowledge():
    rag = RAGService()
    
    queries = [
        "How is GST calculated in StoreAI?",
        "What is the relationship between Sales and Ledgers?",
        "Show me the definition of the Product model in the schema."
    ]
    
    print("\n[TEST] Testing Hybrid Knowledge Retrieval...")
    print("=" * 50)
    
    for q in queries:
        print(f"\nQUERY: {q}")
        result = await rag.process_query(q)
        print(f"SOURCE: {result.source}")
        print(f"RESPONSE: {result.response[:300]}...")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test_knowledge())
