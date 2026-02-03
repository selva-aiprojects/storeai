import asyncio
import chromadb
import os

# Hardcoded for inspection
CHROMA_DB_PATH = "d:/Training/working/Store-AI/python_backend/data/chroma"
COLLECTION_NAME = "storeai_products"

async def dump_chroma():
    print("--- CHROMADB DUMP ---")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    
    for coll_name in [COLLECTION_NAME, "storeai_knowledge"]:
        print(f"\nCollection: {coll_name}")
        try:
            coll = client.get_collection(name=coll_name)
            results = coll.get(limit=10)
            if results and results['ids']:
                for i in range(len(results['ids'])):
                    print(f"ID: {results['ids'][i]}")
                    print(f"Metadata: {results['metadatas'][i]}")
                    print(f"Document: {results['documents'][i][:200]}...")
            else:
                print("Empty collection.")
        except Exception as e:
            print(f"Error accessing collection {coll_name}: {e}")

if __name__ == "__main__":
    asyncio.run(dump_chroma())
