
import os
import asyncio
import chromadb
from typing import List, Dict
import re

# Import logic from existing services
from services.llm import llm_service

# Configuration
CHROMA_DB_PATH = "./chroma_db_v2"
COLLECTION_NAME = "storeai_knowledge"
DOCS_ROOT = "../main/docs"
SCHEMA_PATH = "../main/server/prisma/schema.prisma"

# Initialize Chroma
chroma_client = chromadb.PersistentClient(
    path=CHROMA_DB_PATH,
    settings=chromadb.config.Settings(anonymized_telemetry=False)
)
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    metadata={"hnsw:space": "cosine"}
)

class DocumentProcessor:
    @staticmethod
    def chunk_text(text: str, max_chars: int = 1500) -> List[str]:
        """Simple chunking by paragraphs and length"""
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""
        
        for p in paragraphs:
            if len(current_chunk) + len(p) < max_chars:
                current_chunk += p + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = p + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks

async def index_markdown_files():
    print(f"🚀 Starting Knowledge Ingestion from {DOCS_ROOT}...")
    
    md_files = []
    for root, _, files in os.walk(DOCS_ROOT):
        for file in files:
            if file.endswith(".md"):
                md_files.append(os.path.join(root, file))
    
    print(f"📄 Found {len(md_files)} markdown documents.")
    
    for file_path in md_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            rel_path = os.path.relpath(file_path, DOCS_ROOT)
            print(f"   Indexing: {rel_path}")
            
            chunks = DocumentProcessor.chunk_text(content)
            
            for i, chunk in enumerate(chunks):
                doc_id = f"doc_{rel_path}_{i}".replace("\\", "_").replace("/", "_")
                
                embedding = await llm_service.get_embedding(chunk)
                if not embedding:
                    continue
                
                collection.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[chunk],
                    metadatas=[{
                        "source": rel_path,
                        "type": "documentation",
                        "chunk": i
                    }]
                )
        except Exception as e:
            print(f"❌ Error indexing {file_path}: {e}")

async def index_schema():
    print(f"🏗️ Indexing Database Schema from {SCHEMA_PATH}...")
    
    if not os.path.exists(SCHEMA_PATH):
        print("⚠️ Schema file not found. Skipping.")
        return

    try:
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract individual models for better granularity
        models = re.findall(r"model\s+(\w+)\s+({.*?})", content, re.DOTALL)
        
        for model_name, model_body in models:
            print(f"   Indexing Model: {model_name}")
            text = f"Prisma Schema Model: {model_name}\nDefinition:\n{model_body}"
            
            embedding = await llm_service.get_embedding(text)
            if not embedding:
                continue
            
            collection.upsert(
                ids=[f"schema_{model_name}"],
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "source": "schema.prisma",
                    "type": "database_schema",
                    "model": model_name
                }]
            )
            
    except Exception as e:
        print(f"❌ Error indexing schema: {e}")

async def main():
    # Index technical docs
    await index_markdown_files()
    
    # Index DB schema
    await index_schema()
    
    print("\n✅ Knowledge Ingestion Complete!")

if __name__ == "__main__":
    asyncio.run(main())
