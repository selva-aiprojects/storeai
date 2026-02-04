# StoreAI Technical Design Document (Low-Level Design)

**Document Version:** 2.2.0  
**Last Updated:** 2026-02-04  
**Classification:** Internal / Confidential  
**Author:** AI Product Architect  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [AI Intelligence Layer](#3-ai-intelligence-layer)
4. [System Architecture](#4-system-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Service Layer Design](#6-service-layer-design)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Security Architecture](#8-security-architecture)
9. [DevOps & Deployment](#9-devops--deployment)
10. [State Management](#10-state-management)
11. [Caching Strategy](#11-caching-strategy)
12. [Logging & Monitoring](#12-logging--monitoring)
13. [Dependency Tree](#13-dependency-tree)
14. [Performance Optimization](#14-performance-optimization)
15. [API Reference](#15-api-reference)

---

## 1. Executive Summary

StoreAI is an enterprise-grade, multi-tenant Inventory & Resource Management Platform built with a modern tiered architecture. The platform combines traditional ERP capabilities with an AI-powered Intelligence Layer for predictive insights and natural language querying.

### Key Capabilities
- **Multi-Tenant SaaS Architecture**: Complete tenant isolation with shared infrastructure
- **Real-Time Inventory Management**: FIFO stock deduction with batch tracking
- **AI Intelligence Platform**: Natural language queries powered by RAG (Retrieval-Augmented Generation)
- **Financial Module**: GST-compliant invoicing, daybook, and P&L reporting
- **HR & Payroll Engine**: Attendance tracking with automated payroll calculations

---

## 2. Technology Stack

### 2.1 Development Tools & Languages

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Language** | TypeScript | 5.x | Type-safe development across client/server |
| **Runtime** | Node.js | 18 LTS | Backend API execution |
| **Frontend Framework** | React | 18.x | Component-based UI development |
| **Build Tool** | Vite | 5.x | Fast HMR and production bundling |
| **ORM** | Prisma | 5.x | Type-safe database queries |
| **API Framework** | Express.js | 4.x | RESTful API routing |

### 2.2 Database & Storage

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Primary Database** | PostgreSQL (Neon) | Serverless PostgreSQL with auto-scaling |
| **Vector Database** | ChromaDB | Embedding storage for AI RAG pipeline |
| **Session Storage** | JWT (Stateless) | Token-based authentication |

### 2.3 AI & Machine Learning

| Component | Provider | Model | Purpose |
|-----------|----------|-------|---------|
| **Text Generation** | Groq | Llama 3.1 8B Instant | Fast inference for SQL generation and response synthesis |
| **Embeddings** | Local ONNX | all-MiniLM-L6-v2 | Vector embeddings (Zero-cost, local inference) |
| **Vector Store** | ChromaDB | HNSW (Cosine) | Semantic similarity search |

### 2.4 Middleware & Libraries

| Category | Libraries |
|----------|-----------|
| **Authentication** | bcryptjs, jsonwebtoken |
| **HTTP Client** | axios |
| **Validation** | zod |
| **Animations** | framer-motion |
| **Charts** | recharts |
| **Icons** | lucide-react |
| **Markdown** | react-markdown, remark-gfm |
| **Date Handling** | date-fns |
| **File Export** | xlsx, html2canvas, jspdf |

---

## 3. AI Intelligence Layer

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI Intelligence Platform                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Intent Router│───►│ SQL Handler  │───►│ PostgreSQL (Neon)    │  │
│  │              │    └──────────────┘    └──────────────────────┘  │
│  │              │    ┌──────────────┐    ┌──────────────────────┐  │
│  │              │───►│Vector Handler│───►│ ChromaDB (Embeddings)│  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                    │                       │              │
│         ▼                    ▼                       ▼              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LLM Service (Groq + Local ONNX)            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 RAG Pipeline Components

#### Intent Router
Classifies user queries with a **Prioritized Hybrid Engine**:
- **GENERAL Intent (Priority 1)**: World knowledge, weather, math, or trivia. Uses regex word-boundary matching for heuristic detection and LLM fallback.
- **SQL Intent (Priority 2)**: Structured data retrieval (sales, stock, finance).
- **VECTOR Intent (Priority 3)**: Product search and policy documentation.
- **GREETING Intent**: Basic bot-user interactions.

**Security Guardrails:**
- **Regex-Based SQL Validation**: Filters forbidden keywords (DROP, DELETE, etc.) using `\b` word boundaries to permit column names like `createdAt` or `isDeleted`.
- **Tenant Lockdown**: Every SQL query is automatically wrapped in a `tenantId` scope.

#### Vector Handler
- Uses Local ONNX model (`all-MiniLM-L6-v2`) for zero-latency, private embedding generation.
- Performs cosine similarity search in ChromaDB.
- Persistent storage at `./chroma_db_v2`.

#### Ingestion Pipeline
- **Product Ingester (`indexer.py`)**: Real-time sync of store inventory to vectors.
- **Knowledge Ingester (`knowledge_indexer.py`)**: Chunks and embeds Prisma Schema and documentation.
- **Trigger**: Exposed via `/api/admin/reindex` for on-demand synchronization.

### 3.3 LLM Service Configuration

```python
# Generation Configuration
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
DEFAULT_MAX_TOKENS = 2048
DEFAULT_TEMPERATURE = 0.2
MAX_RETRIES = 2
TIMEOUT_SECONDS = 25

# Embedding Configuration (Local)
DEFAULT_EMBED_MODEL = "all-MiniLM-L6-v2"
TASK_TYPE = "retrieval_query"
```

### 3.4 Response Synthesis

The system uses a two-phase approach:
1. **Data Retrieval**: SQL or Vector search based on intent
2. **Answer Synthesis**: LLM generates human-readable response from data

**Prompt Engineering Constraints:**
- **Grounded Synthesis**: Strict adherence to telemetry for SQL/Vector data.
- **Premium General Mode**: Eloquent, helpful tone for non-platform queries.
- **Telemetry Hiding**: The "Telemetry Data Signal" box is automatically suppressed for `GENERAL` intent for a cleaner UI.
- **No-Hallucination**: If no data is found, the AI explicitly states the absence of records rather than inventing numbers.
- **Markdown Purity**: Auto-formatting of financial tables and product lists.

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React SPA)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ DashboardLayout │  │ SmartTable      │  │ AI Assistant            │ │
│  │ (Auth Context)  │  │ (Data Grid)     │  │ (Chat Interface)        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (Axios + JWT)
┌────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS.JS API SERVER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Auth Controller │  │ CRUD Controllers│  │ Finance Controllers     │ │
│  │ (JWT Validation)│  │ (Products/Sales)│  │ (Daybook/GST/PL)        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICE LAYER                               │   │
│  │  InventoryService | SalesService | HRService | FinanceService   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌────────────────────────────┐      ┌────────────────────────────────────┐
│   PRISMA ORM (PostgreSQL)  │      │   PYTHON BACKEND (FastAPI)         │
│   - Multi-tenant isolation │      │   - RAG Service                    │
│   - Type-safe queries      │      │   - LLM Service                    │
│   - Transaction support    │      │   - Finance Service                │
└────────────────────────────┘      └────────────────────────────────────┘
```

### 4.2 Directory Structure

```
Store-AI/
├── main/
│   ├── client/                  # React Frontend
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   ├── pages/           # Route components
│   │   │   ├── services/        # API client services
│   │   │   ├── context/         # React contexts
│   │   │   └── styles/          # CSS modules
│   │   └── public/              # Static assets
│   ├── server/                  # Express Backend
│   │   ├── src/
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── services/        # Business logic
│   │   │   ├── middleware/      # Auth, error handling
│   │   │   └── routes/          # API route definitions
│   │   └── prisma/              # Database schema & migrations
│   └── docs/                    # Documentation
├── python_backend/              # AI Intelligence Layer
│   ├── services/
│   │   ├── rag.py              # RAG orchestration + Intent Routing
│   │   ├── llm.py              # LLM client (Groq + Local Embed)
│   │   ├── db.py               # Database client
│   │   ├── finance.py          # Finance calculations
│   │   └── hr.py               # HR/Payroll logic
│   ├── main.py                 # FastAPI entrypoint
│   └── chroma_db/              # Vector database storage
└── qa_regression_suite.py      # End-to-end test suite
```

---

## 5. Database Architecture

### 5.1 Schema Overview

The database follows a **Snowflake Schema** centered on the `Tenant` entity for multi-tenant isolation.

#### Core Entity Clusters

**Identity Cluster**
```
Tenant ──┬── UserTenant ──── User
         │                    │
         └── Role ──────── Permission
```

**Commerce Cluster**
```
Product ──┬── ProductBatch ──── Stock
          │                      │
          └── StockLedger ───────┘
          │
          └── SaleItem ──── Sale ──── Customer
```

**Procurement Cluster**
```
Order ──── OrderItem ──── GoodsReceipt ──── ProductBatch
  │
  └── Supplier
```

**Finance Cluster**
```
Daybook ──── Ledger ──── Payment ──── Sale
```

**HR Cluster**
```
Employee ──── Department
    │
    └── Attendance ──── Payroll
```

### 5.2 Key Tables Schema

#### Product Table
```sql
CREATE TABLE "Product" (
    "id" UUID PRIMARY KEY,
    "sku" VARCHAR(50) UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stockQuantity" INTEGER DEFAULT 0,
    "lowStockThreshold" INTEGER DEFAULT 10,
    "categoryId" UUID REFERENCES "Category"("id"),
    "tenantId" UUID NOT NULL REFERENCES "Tenant"("id"),
    "isDeleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_product_tenant ON "Product"("tenantId");
CREATE INDEX idx_product_sku ON "Product"("sku");
```

#### Sale Table
```sql
CREATE TABLE "Sale" (
    "id" UUID PRIMARY KEY,
    "invoiceNo" VARCHAR(50) UNIQUE,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) DEFAULT 0,
    "gstAmount" DECIMAL(10,2) DEFAULT 0,
    "dueDate" DATE,
    "isPaid" BOOLEAN DEFAULT false,
    "customerId" UUID REFERENCES "Customer"("id"),
    "tenantId" UUID NOT NULL REFERENCES "Tenant"("id"),
    "createdAt" TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sale_tenant_date ON "Sale"("tenantId", "createdAt");
```

#### Daybook Table
```sql
CREATE TABLE "Daybook" (
    "id" UUID PRIMARY KEY,
    "date" DATE NOT NULL,
    "type" VARCHAR(50) NOT NULL, -- SALE, PURCHASE, EXPENSE, SALARY
    "description" TEXT,
    "debit" DECIMAL(12,2) DEFAULT 0,
    "credit" DECIMAL(12,2) DEFAULT 0,
    "referenceId" UUID,
    "tenantId" UUID NOT NULL REFERENCES "Tenant"("id")
);
CREATE INDEX idx_daybook_tenant_date ON "Daybook"("tenantId", "date");
```

### 5.3 Indexing Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| All transactional tables | `tenantId` | Tenant isolation for multi-tenant queries |
| Product | `sku` | B-Tree for SKU lookups |
| Sale | `(tenantId, createdAt)` | Composite for date-range reporting |
| Employee | `(tenantId, departmentId)` | Department-wise filtering |
| Attendance | `(employeeId, date)` | Unique attendance records |

---

## 6. Service Layer Design

### 6.1 Inventory Service (FIFO Engine)

**Purpose:** Implements weighted First-In-First-Out stock reduction

**Algorithm:**
```typescript
async deductStock(productId: UUID, quantity: number): Promise<void> {
    // 1. Fetch batches ordered by inwardDate ASC
    const batches = await prisma.productBatch.findMany({
        where: { productId, quantityAvailable: { gt: 0 } },
        orderBy: { inwardDate: 'asc' }
    });

    // 2. Iterate and deduct sequentially
    let remaining = quantity;
    for (const batch of batches) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, batch.quantityAvailable);
        await prisma.productBatch.update({
            where: { id: batch.id },
            data: { quantityAvailable: { decrement: deduct } }
        });
        // 3. Create StockLedger audit entry
        await prisma.stockLedger.create({
            data: { batchId: batch.id, quantity: -deduct, type: 'SALE' }
        });
        remaining -= deduct;
    }

    // 4. Fail if insufficient stock
    if (remaining > 0) {
        throw new InsufficientStockError(productId, quantity);
    }
}
```

### 6.2 Sales & Tax Service

**GST Calculation Logic:**
```typescript
calculateGST(amount: number, rate: number = 18): GSTBreakdown {
    const gstAmount = amount * (rate / 100);
    const cgst = gstAmount / 2;  // Intra-state
    const sgst = gstAmount / 2;
    return { totalTax: gstAmount, cgst, sgst, igst: 0 };
}
```

**Transaction Flow:**
1. Stock Deduction (FIFO)
2. Sale Creation
3. Ledger Posting (CREDIT entry)
4. GST_PAYABLE credit entry

### 6.3 HR & Payroll Engine

**Payroll Formula:**
```
Net Salary = (Basic + HRA + Allowances + OT_Hours × OT_Rate + Incentive%) - Deductions
```

**Calculation Fields:**
| Component | Calculation |
|-----------|-------------|
| OT Rate | Basic / 30 / 8 × 1.5 |
| Incentive | Basic × IncentivePercentage |
| PF Deduction | Basic × 12% |
| Tax Deduction | Based on tax slab |

---

## 7. Frontend Architecture

### 7.1 Component Hierarchy

```
App
├── AuthLayout (Public routes)
│   └── Login / Register
└── DashboardLayout (Protected routes)
    ├── Header (User info, tenant name)
    ├── Sidebar (Navigation menu)
    └── Outlet (Page content)
        ├── Dashboard
        ├── Products / Categories
        ├── Sales / Customers
        ├── Orders / Suppliers
        ├── Finance (Daybook, P&L, GST)
        ├── HR (Employees, Attendance, Payroll)
        ├── Settings
        └── AI Assistant
```

### 7.2 Design System

**Theme Tokens:**
```css
:root {
    /* Primary Colors */
    --primary-purple: #6B46C1;
    --primary-purple-light: #F0E8FF;
    
    /* Background */
    --bg-base: #f0f4f9;
    --bg-surface: #ffffff;
    --bg-sidebar: #1A1F2E;
    
    /* Text */
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    
    /* Borders */
    --border-light: #e2e8f0;
    
    /* Status Colors */
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
}
```

**Typography:**
- **Font Family:** 'Outfit', sans-serif
- **Base Size:** 15px
- **Line Height:** 1.5

### 7.3 Key Components

| Component | Purpose |
|-----------|---------|
| `SmartTable` | Hardware-accelerated data grid with pagination |
| `ActionProgress` | Global request feedback overlay |
| `Modal` | Reusable dialog component |
| `FormField` | Consistent form input styling |
| `StatusBadge` | Color-coded status indicators |

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐
│  Login  │────►│ Validate    │────►│ Generate    │
│  Form   │     │ Credentials │     │ JWT Token   │
└─────────┘     └─────────────┘     └─────────────┘
                       │                    │
                       ▼                    ▼
              ┌─────────────┐      ┌─────────────────┐
              │ bcrypt.hash │      │ Store in        │
              │ comparison  │      │ localStorage    │
              └─────────────┘      └─────────────────┘
```

**JWT Payload Structure:**
```json
{
    "id": "user-uuid",
    "email": "user@tenant.com",
    "role": "ADMIN",
    "tenantId": "tenant-uuid",
    "iat": 1706700000,
    "exp": 1706786400
}
```

### 8.2 Authorization Matrix

| Role | Products | Sales | Finance | HR | AI | Admin |
|------|----------|-------|---------|----|----|-------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| MANAGER | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| STAFF | ✅ (Read) | ✅ | ❌ | ❌ | ✅ | ❌ |
| ACCOUNTANT | ❌ | ✅ (Read) | ✅ | ❌ | ✅ | ❌ |
| HR | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### 8.3 Tenant Isolation

All database queries automatically include `tenantId` filter:
```typescript
// Prisma middleware for automatic tenant filtering
prisma.$use(async (params, next) => {
    if (params.model && params.action !== 'findUnique') {
        params.args.where = {
            ...params.args.where,
            tenantId: currentTenantId
        };
    }
    return next(params);
});
```

---

## 9. DevOps & Deployment

### 9.1 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        RENDER CLOUD                               │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Static Site     │  │ Web Service     │  │ Web Service     │  │
│  │ (React Build)   │  │ (Node.js API)   │  │ (Python FastAPI)│  │
│  │ client/dist     │  │ server/dist     │  │ python_backend  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        NEON CLOUD                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL (Serverless)                         │ │
│  │              - Auto-scaling                                  │ │
│  │              - Branching for testing                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 CI/CD Pipeline (Bitbucket)

```yaml
# bitbucket-pipelines.yml
image: node:22

pipelines:
  default:
    - step:
        name: Build & Test
        caches:
          - node
        script:
          # Server Build
          - cd main/server
          - npm ci
          - npx prisma generate
          - npm run build
          # Client Build
          - cd ../client
          - npm ci
          - npm run build
        artifacts:
          - main/client/dist/**
          - main/server/dist/**
```

### 9.3 Environment Variables

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Node.js, Python | PostgreSQL connection string |
| `JWT_SECRET` | Node.js, Python | Token signing secret |
| `GROQ_API_KEY` | Python | Groq LLM API key |
| `GOOGLE_API_KEY` | Python | Gemini embedding API key |
| `PORT` | All | Service port |

---

## 10. State Management

### 10.1 Client State Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REACT CONTEXT PROVIDERS                     │
├─────────────────────────────────────────────────────────────────┤
│  AuthContext                                                     │
│  ├── user: User | null                                          │
│  ├── token: string | null                                       │
│  ├── login: (email, password) => Promise                        │
│  └── logout: () => void                                         │
├─────────────────────────────────────────────────────────────────┤
│  WorkspaceContext                                                │
│  ├── tenant: Tenant                                             │
│  ├── permissions: Permission[]                                  │
│  └── sidebarCollapsed: boolean                                  │
├─────────────────────────────────────────────────────────────────┤
│  UIContext                                                       │
│  ├── theme: 'light' | 'dark'                                    │
│  ├── loading: boolean                                           │
│  └── notifications: Notification[]                              │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Data Fetching Pattern

Using Axios interceptors for consistent API handling:
```typescript
// Request interceptor - attach JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

---

## 11. Caching Strategy

### 11.1 Client-Side Caching

| Data Type | Strategy | TTL |
|-----------|----------|-----|
| User Profile | localStorage | Session |
| Dropdown Lists | useState memo | Component lifecycle |
| Paginated Data | No cache (fresh fetch) | - |
| Dashboard Stats | 30-second refresh | 30s |

### 11.2 Server-Side Caching

| Data Type | Strategy | Implementation |
|-----------|----------|----------------|
| Prisma Queries | Connection pooling | Neon pooler |
| Heavy Aggregations | None (real-time) | - |
| AI Embeddings | ChromaDB persistence | Disk |

---

## 12. Logging & Monitoring

### 12.1 Python Backend Logging

```python
# utils/logger.py
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s [%(name)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/app.log')
    ]
)

def log_api_call(endpoint: str, duration_ms: float, status: int):
    logger.info(f"API: {endpoint} | {duration_ms:.0f}ms | {status}")

def log_error(error: Exception, context: dict):
    logger.error(f"ERROR: {error} | Context: {context}")
```

### 12.2 Logged Events

| Event | Level | Data Captured |
|-------|-------|---------------|
| API Request | INFO | Endpoint, duration, status |
| LLM Generation | INFO | Tokens used, latency |
| SQL Execution | DEBUG | Query, row count |
| Authentication | INFO | User ID, tenant ID |
| Errors | ERROR | Stack trace, context |

---

## 13. Dependency Tree

### 13.1 Node.js Backend

```
express@4.x
├── bcryptjs (password hashing)
├── jsonwebtoken (JWT auth)
├── cors (cross-origin)
├── helmet (security headers)
├── @prisma/client (database)
└── winston (logging)
```

### 13.2 React Frontend

```
react@18.x
├── react-router-dom (routing)
├── axios (HTTP client)
├── framer-motion (animations)
├── recharts (charts)
├── lucide-react (icons)
├── react-markdown (markdown rendering)
├── xlsx (Excel export)
├── html2canvas + jspdf (PDF export)
└── date-fns (date utilities)
```

### 13.3 Python Backend

```
fastapi @0.109.0
├── uvicorn / uvloop / starlette (Web & Runtime)
├── asyncpg / sqlalchemy / pypika (Database & SQL)
├── groq (LLM Inference)
├── chromadb (Vector Store)
├── onnxruntime (Local Embedding Inference)
├── tokenizers / huggingface-hub (AI Utilities)
├── pydantic (Schema & Validation)
├── PyJWT / bcrypt (Security & Auth)
├── opentelemetry-* (Observability & Monitoring)
├── httpx / requests (HTTP Clients)
├── posthog (Product Analytics)
├── rich / typer / coloredlogs / tqdm (Logging & CLI)
└── python-dotenv (Configuration)
```

---

## 14. Performance Optimization

### 14.1 Frontend Optimizations

| Technique | Implementation |
|-----------|----------------|
| Code Splitting | React.lazy() for route components |
| Image Optimization | WebP format, lazy loading |
| Bundle Size | Tree shaking via Vite |
| Animations | GPU-accelerated via will-change |
| Pagination | Server-side with limit/offset |

### 14.2 Backend Optimizations

| Technique | Implementation |
|-----------|----------------|
| Connection Pooling | Neon pooler (25 connections) |
| Query Optimization | Selective fields with Prisma select |
| N+1 Prevention | Eager loading with include |
| Async Processing | Python asyncio for I/O |
| Rate Limiting | Token bucket (50 req/min) |

### 14.3 AI Pipeline Optimizations

| Technique | Implementation |
|-----------|----------------|
| Semaphore | Single concurrent request |
| Retry Logic | Exponential backoff (2 retries) |
| Timeout | 25 second max |
| Result Limiting | 15 SQL rows, 5 vector results |
| Prompt Truncation | 20,000 character max |

---

## 15. API Reference

### 15.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Current user profile |

### 15.2 Resource Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Soft delete product |
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Create sale |
| GET | `/api/customers` | List customers |
| GET | `/api/orders` | List purchase orders |

### 15.3 Finance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/daybook` | Daybook entries |
| GET | `/api/finance/pl` | Profit & Loss report |
| GET | `/api/finance/liability` | Liability tracker |
| GET | `/api/finance/ledger` | General ledger |

### 15.4 AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | AI chat query |
| POST | `/api/ai/stock-analyze` | Stock analysis (external) |
| POST | `/api/admin/reindex` | Trigger data re-indexing |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-28 | AI Architect | Initial creation |
| 2.0.0 | 2026-01-31 | AI Architect | Added AI Intelligence Layer, updated schemas |
| 2.1.0 | 2026-02-04 | AI Architect | Switched to Local ONNX, added General Intent |
| 2.2.0 | 2026-02-04 | AI Architect | Final Review: Regex Safety, Prioritized Intent Routing, UI Polish |

---

**End of Document**
