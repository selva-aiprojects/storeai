# StoreAI Technical Design - Intelligence Engine Module
**Document ID:** TDD-002
**Module:** AI / Python Backend
**Version:** 1.0
**Status:** Approved

---

## 1. Module Overview
The **Intelligence Engine** is a specialized microservice responsible for all AI/ML workloads within the StoreAI platform. It decouples resource-intensive AI processing from the core transactional backend, ensuring system stability and scalability.

**Key Responsibilities:**
- Natural Language Understanding (NLU) of user queries.
- Retrieval-Augmented Generation (RAG) from documentation.
- Text-to-SQL generation for financial analytics.
- Automated anomaly detection (e.g., Stock Alerts).

---

## 2. Architecture Components

### A. Service Layer (`services/`)
- **`RAGService`**: The central orchestrator. It receives queries, invokes the Intent Router, executes retrieval strategies, and synthesizes the final answer.
- **`LLMService`**: An abstraction layer over AI providers. Currently implements the **GroqClient** for LLM generation and **LocalEmbeddingClient** for vector embeddings.
- **`SQLHandler`**: Specifically designed to execute read-only analytics queries against the Postgres database with strict safety guardrails.
- **`AIOrchestrationService`**: Hybrid orchestration layer that can combine internal RAG outputs with external-world context and produce a synthesized response.

### B. Routing Logic (`IntentRouter`)
The system employs a "Semantic Router" to decide how to handle a query:

| Intent | Classification Logic | Action |
| :--- | :--- | :--- |
| **SQL / ANALYTICS** | Query contains financial terms ("sales", "profit", "count", "trend"). | Generates SQL query -> Executes on DB -> Synthesizes result. |
| **VECTOR / KNOWLEDGE** | Query refers to static info ("how to", "policy", "documentation"). | Vector Search (ChromaDB) -> Retrieves Docs -> Synthesizes answer. |
| **GREETING / CHIT-CHAT** | Short, non-technical phrases. | Direct LLM response (Low latency). |

### C. Data Layer
- **ChromaDB**: Embedded vector store holding two collections:
  - `storeai_products`: For semantic product search.
  - `storeai_knowledge`: For system documentation retrieval.
- **PostgreSQL (Read-Only)**: Direct connection to the main database for real-time analytics.

---

## 3. Workflow Implementation

### Retrieval-Augmented Generation (RAG) Flow
1.  **User Input**: "How do I process a return?"
2.  **Embedding**: Input is converted to a 384-d vector.
3.  **Search**: System queries `storeai_knowledge` collection (Top-K=5).
4.  **Context Assembly**: Retrieved markdown chunks are appended to the system prompt.
5.  **Synthesis**: LLM generates a user-friendly answer citing the source.

### Text-to-SQL Flow
1.  **User Input**: "Total sales for last month?"
2.  **Schema Injection**: Relevant table schemas (`Sale`, `Payment`) are injected into the prompt.
3.  **Generation**: LLM outputs a valid PostgreSQL query: `SELECT SUM(totalAmount) FROM "Sale" ...`.
4.  **Validation**: `SQLValidator` checks for forbidden keywords (`DROP`, `DELETE`).
5.  **Execution**: Query runs, returning JSON rows.
6.  **Explanation**: LLM explains the data in plain English.

---

## 4. Integration Specifications

### API Interface
The module exposes a REST API via **FastAPI** on Port **8000**.

- `POST /api/chat`: Main conversation endpoint.
  - **Auth**: Bearer Token (JWT).
  - **Payload**: `{ "query": "...", "history": [...] }`
  - **Response**: `{ "response": "...", "source": "SQL|VECTOR", "context": [...] }`
- `POST /api/ai/orchestrate`: Orchestrated AI endpoint for store + market context.
  - **Auth**: Bearer Token (JWT).
  - **Payload**: `{ "query": "...", "history": [...], "mode": "auto|langgraph|crew" }`
  - **Response**: `{ "response": "...", "source": "...", "route": "store|external|hybrid", "mode": "..." }`

### Performance Characteristics
- **Latency**: 
  - Standard Chat: < 2s
  - Vector Search: < 7s (optimized via Thread Pool) -> Fixed in recent patch
  - SQL Analytics: 2-5s (dependent on DB load)
- **Concurrency**: Asyncio event loop handles 100+ concurrent connections; blocking I/O offloaded to thread executors.

---

## 5. Orchestration and LLMOps Notes

### Orchestration behavior
- Route classification:
  - `store`: Internal ERP/RAG context only.
  - `external`: Outside-world business context only.
  - `hybrid`: Internal + external context with synthesis.
- Engine:
  - Primary: LangGraph workflow graph.
  - Fallback: Native async orchestration if LangGraph is unavailable.
  - Optional: CrewAI post-processing (`mode=crew`) when enabled in separate worker runtime.

### Observability (LLMOps)
- Structured orchestration events are appended to:
  - `python_backend/logs/llmops_events.jsonl`
- Event fields include:
  - `timestamp_utc`, `event`, `mode`, `route`, `source`, `latency_ms`, `tenant_id`, `success`.

### Dependency strategy
- Core AI runtime keeps `chromadb==0.4.22` for existing RAG compatibility.
- CrewAI ecosystem currently requires newer Chroma versions; use a separate worker environment:
  - `python_backend/requirements.crewai-worker.txt`
