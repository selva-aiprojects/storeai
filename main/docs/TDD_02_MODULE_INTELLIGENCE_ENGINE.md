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

### Intelligence Engine Orchestration Visual
![GenAI Orchestration Workflow](file:///d:/Training/working/Store-AI/main/docs/assets/genai_orchestration.png)

### A. Service Layer (`services/`)
- **`AIOrchestrationService`**: The primary brain using **LangGraph**. It manages cycle-aware state transitions between intent classification, data retrieval, and synthesis.
- **`RAGService`**: Handles the core retrieval logic (SQL vs Vector) while maintaining strict **multi-tenant isolation**.
- **`LLMService`**: Abstraction over Groq. Implements **Virtual LoRA Adapters** (Finance, Inventory, HR, etc.) to inject specialized domain expertise into responses.
- **`SQLHandler`**: Generates and executes read-only PostgreSQL queries with automatic `tenantId` filtering and safety guardrails.

### B. Routing Logic (`IntentRouter` & LangGraph)
The system employs a multi-stage routing mechanism:
1.  **Keyword/LLM Hybrid Router**: Initial classification into SQL, Vector, or General intents.
2.  **LangGraph State Routing**: Dynamically moves between internal telemetry (`store_node`) and external context (`external_node`) based on the query domain.
3.  **Domain Mapping**: Specific keywords (e.g., "profit", "ledger") map queries to specialized LoRA adapters for refined synthesis.

### C. Data Layer
- **ChromaDB**: Embedded vector store with metadata-based tenant isolation.
- **PostgreSQL (Read-Only)**: Real-time analytics connection where every query is injected with `WHERE "tenantId" = '...'`.

---

## 3. Workflow Implementation

### Retrieval-Augmented Generation (RAG) Flow
1.  **User Input**: "How do I process a return?"
2.  **Embedding**: Input converted to a 384-d vector via local ONNX model.
3.  **Search**: Queries `storeai_knowledge` using metadata filters to ensure tenant/document relevance.
4.  **Synthesis**: LLM generates an answer, citing internal documentation sources.

### Text-to-SQL Flow (Tenant Isolated)
1.  **User Input**: "Total sales for yesterday?"
2.  **Prompt Construction**: Injects table schemas AND the active `tenantId`.
3.  **Generation**: LLM produces SQL with a mandatory `CROSS JOIN` or `WHERE` clause for isolation: `SELECT ... FROM "Sale" T WHERE T."tenantId" = 'storeai' AND ...`.
4.  **Guardrails**: `SQLValidator` enforces `LIMIT 50` and read-only keywords.
5.  **Data Factuality**: synthesis mandated to explain the specific numbers returned.

---

## 4. Integration Specifications

### Multi-Tenant AI API
- `POST /api/chat`:
  - **Auth**: JWT with `tenantId` payload.
  - **Context**: Every request transmits the tenant context to ensure the AI "brain" only sees its own data.
  - **Transparency**: Returns a `context` object for the "Data Insight Breakdown" UI.

---

## 5. Orchestration and LLMOps Notes

### Agentic Orchestration (LangGraph)
- **Cycle-Aware**: Allows the AI to "re-think" if the first data retrieval was insufficient.
- **Nodes**: `intent_step`, `store_step`, `external_step`, `synthesis_step`.
- **Adapters**:
  - `finance_qlora`: Specializes in ROI, liquidity, and P&L.
  - `inventory_lora`: Specializes in demand forecasting and SKU velocity.
  - `hr_lora`: Focuses on workforce efficiency and payroll.

### Observability & Transparency
- **Telemetry**: "Data Insight Breakdown" unhidden in the frontend for user validation of retrieved database facts.
- **Logging**: Every orchestration step is logged with `tenant_id` for auditing and performance monitoring.
