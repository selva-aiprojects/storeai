# Data Ingestion & Pipeline Workflow

## Executive Summary
The data ingestion pipeline for the StoreAI Intelligence Engine is currently designed as an **On-Demand (Manual)** process. It does not utilize background schedulers (like Cron or Celery) at this stage. Data synchronization is triggered by executing specific Python scripts that fetch, cleanse, and index data into the Vector Store.

---

## 1. Product Data Pipeline

### **A. Trigger Mechanism**
- **Type**: On-Demand / Manual
- **Command**: `python python_backend/indexer.py`
- **Schedule**: None (Run when catalogs are updated).

### **B. Ingestion Flow**
1.  **Fetch**: Connects to the primary PostgreSQL database using the `db` service.
2.  **Query**: Executes a `SELECT` statement joining `Product` and `Category` tables.
    - *Filter*: `is_deleted = false` (Active products only).
3.  **Process**: Iterates through the result set.

### **C. Data Cleansing & Formatting**
The pipeline applies specific logic to prepare data for semantic search:
1.  **Null Handling**:
    - `Description`: Defaults to empty string if NULL.
    - `Category`: Defaults to "Uncategorized" if NULL or missing.
2.  **Semantic Formatting**:
    - Transforms structured row data into a natural language sentence to improve embedding quality.
    - *Format*: `"{Name}. Category: {Category}. {Description}. Price: ${Price}."`
    - *Why?* Vector models understand sentences better than raw JSON key-values.

### **D. Indexing Strategy**
1.  **Embedding Generation**: Local ONNX `all-MiniLM-L6-v2`.
2.  **Batching**: Batches of 10 with throttling to preserve resources.
3.  **Tenant Isolation (Metadata)**:
    - Data is written to the `storeai_products` collection.
    - **CRITICAL**: Every vector is tagged with a `tenant_id` metadata field. 
    - **Retrieval**: The `RAGService` applies a metadata filter `{"tenant_id": "active_tenant_id"}` during search to ensure cross-tenant data leakage is impossible.

---

## 2. Knowledge Base Pipeline

### **A. Trigger Mechanism**
- **Type**: On-Demand / Manual
- **Command**: `python python_backend/knowledge_indexer.py`
- **Schedule**: None (Run when documentation or schema changes).

### **B. Ingestion Flow**
Ingests unstructured documentation relevant to the platform:
1.  **Markdown Documentation**: Scans `main/docs/*.md`.
2.  **Database Schema**: Parsed from `schema.prisma`.

### **C. Data Cleansing & Chunking**
1.  **Documentation (Text Splitting)**:
    - **Strategy**: Semantic Paragraph Split.
    - **Logic**:
        - Splits text by double newline `\n\n` (paragraphs).
        - Accumulates paragraphs until the chunk size reaches **1500 characters**.
        - *Benefit*: Preserves context better than arbitrary character-count splitting.
2.  **Schema Parsing (Regex)**:
    - **Logic**: Uses Regex to extract individual `model Name { ... }` blocks from the Prisma file.
    - *Benefit*: Allows the AI to retrieve specific table definitions rather than the entire schema at once.

### **D. Indexing Strategy**
1.  **Embedding**: Individual chunks/models are embedded.
2.  **Metadata Tagging**:
    - Each vector is tagged with its `source` (file path), `type` ("documentation" vs "database_schema"), and `chunk` index.
3.  **Upsert**: Written to the `storeai_knowledge` collection.

---

## Summary of Capabilities

| Feature | Current Implementation |
| :--- | :--- |
| **Scheduling** | **On-Demand** (Manual Script Execution) |
| **Source Connectivity** | **Direct DB Connection** (Products) & **File System** (Docs) |
| **Transformation** | **Python-based** (In-memory string formatting & Regex) |
| **Indexing Mode** | **Batch Upsert** (Consistent State) |
| **Embedding Engine** | **Local CPU** (No API costs/latency) |
