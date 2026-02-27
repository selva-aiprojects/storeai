# StoreAI Technical Design Document - Overall Architecture
**Document ID:** TDD-001
**Version:** 1.0
**Status:** Approved
**Date:** 2026-02-02

---

## 1. Executive Summary
StoreAI is a next-generation Enterprise Resource Planning (ERP) platform infused with advanced Generative AI capabilities. Unlike traditional ERPs that rely solely on structured reporting, StoreAI integrates an **Intelligence Engine** that allows users to query their business data using natural language, perform predictive analytics, and automate complex workflows.

This document outlines the high-level architecture, technology stack, and system integration patterns that power the StoreAI platform.

---

## 2. System Architecture

The system follows a **Microservices-inspired Monolithic Architecture**, where the Core Platform and the Intelligence Engine run as distinct services but share a unified data layer.

### High-Level Architecture Diagram
```mermaid
graph TD
    Client[Client (Browser/Mobile)]
    Superadmin[Superadmin Portal]
    
    subgraph "Application Layer"
        LB[Load Balancer / Gateway]
        TenantMiddleware[Tenant Isolation & RBAC Middleware]
        NodeAPI[Core Backend (Node.js/Express)]
        PyAPI[Intelligence Engine (Python/FastAPI)]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL Database)]
        Redis[(Redis Cache)]
        Chroma[(ChromaDB Vector Store)]
    end
    
    subgraph "External Services"
        Groq[Groq AI Platform]
    end

    Client -->|HTTPS/REST| LB
    Superadmin -->|Admin Ops| NodeAPI
    LB -->|Tenant Scoped| TenantMiddleware
    TenantMiddleware -->|/api/*| NodeAPI
    TenantMiddleware -->|/api/ai/*| PyAPI
    
    NodeAPI -->|Read/Write| PG
    NodeAPI -->|Cache| Redis
    
    PyAPI -->|Read-Only (Scoped)| PG
    PyAPI -->|Semantic Search| Chroma
    PyAPI -->|LLM Inference| Groq
```

---

## 3. Technology Stack

### A. Frontend (Client)
- **Framework**: React 18 (Vite) for high-performance rendering.
- **Styling**: Vanilla CSS with Design System tokens for premium aesthetics.
- **State Management**: React Context & Hooks.
- **Multi-Tenancy**: Dynamic branding (Logos/Themes) based on tenant context.

### B. Core Backend (Business Logic)
- **Runtime**: Node.js (v18+).
- **Framework**: Express.js with Custom Middleware for Tenant Isolation.
- **ORM**: Prisma with Middleware for automatic `tenantId` injection.
- **Roles**: Superadmin (Global), Admin (Tenant), Staff (Tenant).

### C. Intelligence Engine (AI)
- **Runtime**: Python 3.9+.
- **Orchestration**: **LangGraph** for cycle-aware agentic workflows.
- **Expertise**: Multi-LoRA Adapters (Finance, Inventory, HR).
- **Vector Database**: ChromaDB (Local Persistent) with Metadata isolation.
- **LLM Integration**: Groq API (Llama 3.1) for low-latency synthesis.

### D. Data Persistence
- **Primary Database**: PostgreSQL 15.
- **Architecture**: Shared Database, Shared Schema with `tenantId` Row-Level Security (RLS) simulation via Prisma.

---

## 4. Key Design Principles

### 1. Robust Multi-Tenancy
The system is built from the ground up to support multiple organizations (Tenants).
- **Tenant Isolation**: Every database query is strictly scoped by `tenantId`.
- **Superadmin Role**: A global administrative tier for managing tenant lifecycles, global settings, and cross-tenant health metrics.
- **Branding Isolation**: Support for tenant-specific logos (`logo-mt.png` logic) and platform customization.

### 2. Hybrid Agentic Intelligence
The Intelligence Engine uses a sophisticated **LangGraph Orchestrator**:
- **Dynamic Routing**: Classifies intent (Finance vs Inventory vs Market) and routes to specialized LoRA adapters.
- **Data Transparency**: Response synthesis mandated to include raw database numbers for fact-based analysis.
- **Telemetry UI**: "Data Insight Breakdown" unhidden to show users the exact data points retrieved by the AI.

### 3. Security
- **Data Privacy**: No customer PII is sent to external AI providers (Groq) without sanitization.
- **Encryption**: At rest (DB) and in transit (TLS 1.2+).
- **Network**: Python Backend runs on a private internal port (8000), accessible only via the internal network or authenticated gateway.

---

## 5. Architectural Design Patterns

The platform implements several established architectural patterns to ensure maintainability, scalability, and separation of concerns.

### A. Companion Service Pattern (Sidecar)
- **Problem**: Running heavy AI workloads in the main Node.js event loop blocks business transactions.
- **Solution**: The **Intelligence Engine** runs as a specialized "Companion Service" alongside the Core Platform. It shares the same data layer but operates independently.
- **Benefit**: AI latencies or crashes do not bring down the core ERP system.

### B. Layered Architecture (Separation of Concerns)
The Core Platform (Node.js) strictly adheres to a **3-Layer Architecture**:
1.  **Controller Layer** (Presentation): Handles HTTP request parsing and response formatting.
2.  **Service Layer** (Domain Logic): Executes business rules, calculations, and transaction orchestration.
3.  **Data Access Layer** (Persistence): Prisma ORM handles direct SQL generation and connection pooling.

### C. Composite View Pattern
The Frontend (React) constructs pages using atomic, reusable components (Cards, Tables, KPI Widgets). This allows the Dashboard to be a **Composite View** of independent data streams (Sales, Inventory, AI Insights).

### D. Strategy Pattern (AI Routing)
The Intelligence Engine uses a functional **Strategy Pattern** via the `IntentRouter`.
- **Context**: User Query.
- **Strategies**: `SQLStrategy` (Analytical) vs `VectorStrategy` (Semantic).
- **Execution**: The router selects the optimal retrieval strategy at runtime based on query intent classification.
