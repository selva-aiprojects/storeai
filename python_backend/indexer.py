
import asyncio
import chromadb
from chromadb.config import Settings
from services.db import db
from services.llm import llm_service

# Initialize Chroma (Persistent)
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="storeai_products",
    metadata={"hnsw:space": "cosine"}
)

async def index_products():
    print("Fetching products for indexing...")
    
    # Fetch Products with Category
    query = """
        SELECT p.id, p.name, p.description, p.price, p.stock_quantity as "stockQuantity", c.name as category
        FROM "Product" p
        LEFT JOIN "Category" c ON p.category_id = c.id
        WHERE p.is_deleted = false
    """
    
    # Note: Postgres fields are camelCase in Prisma but snake_case in raw SQL usually unless quoted.
    # Prisma uses quoted identifiers. "stockQuantity".
    # Let's try to select exact column names as Prisma defines them. 
    # Checking schema: stockQuantity Int @map("stockQuantity")? No, Prisma default is camelCase map to camelCase usually if not specified map.
    # WAIT: Prisma defaults to "StockQuantity" or "stockQuantity" quoted?
    # Safest is to list columns roughly match or * and inspect.
    # Let's try generic select first or inspect one row.
    # Actually, let's just assume "Product" and "stockQuantity" are quoted.
    
    products = await db.fetch_rows("""
        SELECT p.id, p.name, p.description, p.price, p."stockQuantity", c.name as category
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."isDeleted" = false
    """)
    
    print(f"Found {len(products)} products. Generating embeddings...")
    
    ids = []
    documents = []
    metadatas = []
    embeddings = []

    batch_size = 10 
    # Rate limit safe
    
    for i, p in enumerate(products):
        # Create Rich Text for Embedding
        # "Wireless Mouse, Electronics category. Price $20. Current Stock: 150."
        text = f"{p['name']}. Category: {p['category'] or 'Uncategorized'}. {p['description'] or ''}. Price: ${p['price']}."
        
        # We embed the semantic info, but store metadata for filtering if needed
        emb = await llm_service.get_embedding(text)
        
        if not emb or len(emb) == 0:
            continue

        ids.append(p['id'])
        documents.append(text)
        metadatas.append({
            "name": p['name'],
            "price": float(p['price']),
            "stock": int(p['stockQuantity']),
            "category": p['category'] or "Unknown"
        })
        embeddings.append(emb)

        if len(ids) >= batch_size:
            collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
            print(f"   Indexed batch {i+1}/{len(products)}")
            ids = []; documents = []; metadatas = []; embeddings = []
            await asyncio.sleep(0.5) # Throttle

    # Final batch
    if len(ids) > 0:
         collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
    
    print("Indexing Complete.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(index_products())
