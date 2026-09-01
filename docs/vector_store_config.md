# Vector Store & Data Source Configuration

## Executive Summary
This document outlines the configuration of the **Vector Store (ChromaDB)** and the data sources feeding into the StoreAI Intelligence Engine. This setup powers the RAG (Retrieval-Augmented Generation) capabilities, enabling the AI to answer queries about products, inventory, and technical documentation.

## 1. Vector Database Architecture
The platform uses **ChromaDB** as the embedded vector database.

- **Type**: Local Persistent Vector Store
- **Storage Path**: `python_backend/chroma_db`
- **Embedding Model**: `all-MiniLM-L6-v2`
  - **Type**: ONNX (CPU-optimized, local execution)
  - **Dimension**: 384
  - **Provider**: `chromadb.utils.embedding_functions.DefaultEmbeddingFunction`
- **Service Handler**: `python_backend/services/rag.py` (`VectorHandler`)

## 2. Dataset Sources & Collections

The Vector Store is divided into two primary collections to separate operational data from technical knowledge.

### Collection A: `storeai_products`
**Purpose**: Powers queries related to product catalog, pricing, stock levels, and categorization.

| Attribute | Details |
| :--- | :--- |
| **Source System** | PostgreSQL Database (tables: `Product`, `Category`) |
| **Ingestion Script** | `python_backend/indexer.py` |
| **Update Frequency** | Manual trigger (currently) |
| **Record Count** | ~117 records (as of last index) |

**Schema Mapping:**
- **ID**: `Product.id` (UUID)
- **Document Content**: Rich text composition:
  > *"{Product Name}. Category: {Category Name}. {Description}. Price: ${Price}."*
- **Metadata**:
  - `name`: Product Name
  - `price`: Product Price (Float)
  - `stock`: Stock Quantity (Int)
  - `category`: Category Name

---

### Collection B: `storeai_knowledge`
**Purpose**: Powers queries related to platform usage, technical architecture, and database schemas.

| Attribute | Details |
| :--- | :--- |
| **Source System** | Local File System (Markdown Docs & Prisma Schema) |
| **Ingestion Script** | `python_backend/knowledge_indexer.py` |
| **Update Frequency** | Manual trigger (currently) |
| **Record Count** | ~122 records (as of last index) |

**Data Sources:**
1.  **Technical Documentation**:
    - **Path**: `main/docs/*.md`
    - **Content**: User manuals, system guides, implementation plans.
    - **Chunking**: By paragraph (~1500 chars max).
2.  **Database Schema**:
    - **Path**: `main/server/prisma/schema.prisma`
    - **Content**: Prisma data models and relationships.
    - **Granularity**: Per-model embedding.

**Schema Mapping:**
- **ID**: File path + Chunk Index (or Model Name)
- **Document Content**: Raw text chunk or Model definition block.
- **Metadata**:
  - `source`: Relative file path
  - `type`: `documentation` OR `database_schema`
  - `chunk`: Chunk index (for docs)
  - `model`: Model name (for schema)

---

## 3. Configuration & Optimization

### Initialization
The Vector Store is initialized as a singleton in `python_backend/services/rag.py` via the `RAGService` class.

```python
self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
self.product_collection = self.chroma_client.get_or_create_collection(...)
self.knowledge_collection = self.chroma_client.get_or_create_collection(...)
```

### Performance Optimization (Non-Blocking)
To prevent timeouts during high-load retrieval:
- **Thread Pooling**: `VectorHandler` uses `asyncio.to_thread` to execute ChromaDB queries in a separate thread pool, preventing the main event loop from blocking.
- **Hybrid Search**: The system attempts SQL generation first; if that fails or returns no data, it falls back to this Vector Store retrieval.
