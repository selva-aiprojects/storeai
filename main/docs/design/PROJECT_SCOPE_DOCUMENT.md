# StoreAI Enterprise: Project Scope Document
**Version:** 2.2.0 (Stable)
**Status:** FINAL
**Last Updated:** 2026-02-04

---

## 1. Project Objective
StoreAI Enterprise is designed to be the "Intelligence Layer" for modern retail and distribution. The primary objective is to unify disconnected business silos (Inventory, HR, Finance, AI) into a single, high-performance, multi-tenant platform that provides real-time operational insights via natural language.

---

## 2. Functional Scope (In-Scope)

### 2.1 Multi-Tenant Core Architecture
- **Tenant Isolation**: Strict logical isolation of data at the database level using `tenantId`.
- **Identity & RBAC**: Comprehensive Role-Based Access Control (Super Admin, Admin, Manager, Staff, Accountant, HR).
- **Stateless Authentication**: JWT-based session management across Node.js and Python backends.

### 2.2 Inventory & Supply Chain Management
- **FIFO Engine**: Intelligent Stock Deduction based on the First-In-First-Out principle using `ProductBatch` tracking.
- **Stock Audit**: Real-time `StockLedger` for every movement (Inward, Sale, Adjustment).
- **Low Stock Alerts**: Threshold-based monitoring of product availability.
- **Procurement Flow**: End-to-end lifecycle from Purchase Order creation to Goods Receipt.

### 2.3 Sales & Commerce
- **Point of Sale (POS)**: High-velocity sales interface with real-time inventory locking.
- **Sales Return Protocol**: Integrated handling of returns with automatic inventory restock (Optional).
- **Dynamic Tax Calculation**: Multi-tier GST calculation integrated directly into the billing flow.

### 2.4 Accounting & Financial Intelligence
- **Double-Entry Ledger**: Automated posting of Sale (Income) and Purchase (Expense) events.
- **Financial Statements**: Real-time generation of Daybook, P&L Statement, and GST Tax Summaries.
- **Aging Analysis**: Tracking of payables and receivables relative to due dates.

### 2.5 Human Capital Management (HR)
- **Employee Lifecycle**: Departmental organization and designation management.
- **Attendance-Based Payroll**: Automated salary calculation linked to attendance logs (including LOP, OT, and Incentives).
- **Payroll Disbursement**: Generation of digital pay stubs and disbursement records.

### 2.6 AI Intelligence Layer (The Crown Jewel)
- **RAG Pipeline**: Retrieval-Augmented Generation for semantic product search and internal policy knowledge.
- **Natural Language SQL**: Conversion of human queries (e.g., "Show me top sales of yesterday") into safe, tenant-isolated PostgreSQL queries.
- **General Intelligence Mode**: Support for out-of-scope general knowledge questions with premium brand-aware responses.
- **Local Embedded Inference**: Zero-cost, high-privacy vector embeddings using local ONNX models.

---

## 3. Technical Scope & Boundaries

### 3.1 Technology Stack
- **Frontend**: React 18, Vite, Framer Motion, Recharts.
- **Backend API**: Node.js, Express.js (Business Logic), TypeScript.
- **AI Backend**: Python FastAPI (RAG, Groq LLM, ONNX Embeddings).
- **Database**: PostgreSQL (Neon Serverless), ChromaDB (Vector Store).

### 3.2 Security Perimeter
- **SQL Injection Prevention**: Forced regex-based word boundary validation for AI-generated queries.
- **XSS/CSRF Protection**: Native React sanitization and secure JWT handling.
- **Infrastructure Safety**: Cloud-native deployment via Render and Neon.

---

## 4. Out of Scope (Future Roadmap)
- **Mobile Native Apps**: Native iOS/Android apps for barcode scanning (Currently uses Responsive Web).
- **Offline Mode**: The system requires an active internet connection for database/LLM synchronization.
- **Third-Party Logistics (3PL) Integration**: Direct API hooks to FedEx/DHL (Currently uses manual tracking).
- **Multi-Currency Support**: Currently localized to a single primary currency per tenant.

---

## 5. Non-Functional Requirements
- **Latency**: AI intent classification < 500ms; Dashboard aggregations < 200ms.
- **Scalability**: Capable of handling 1,000+ transactional events per day per tenant.
- **Availability**: 99.9% uptime goal via Render Cloud infrastructure.

---

**Sign-off:**
*Technical Architect / AI Lead*
*2026-02-04*
