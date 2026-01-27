# 🏗️ StoreAI: Solution Architecture & Technical Documentation
**Version:** 3.1.0 (Enterprise Baseline)  
**Architecture Style:** Modular Monolith (Client-Server Separation)  
**Theme:** Premium Enterprise Light View  

---

## 1. System Architecture Overview
StoreAI is designed as a full-stack web application optimized for localized high-performance inventory and financial management.

*   **Frontend (Client):** A Modern Single Page Application (SPA) built with **React** and **TypeScript**. It utilizes a centralized "Operational Core" layout with a real-time reactive data mesh.
*   **Backend (Server):** A robust **Node.js** and **Express** API following RESTful principles, enforcing strict JWT-based authentication for sensitive operations.
*   **Database:** **PostgreSQL** orchestrated through the **Prisma ORM**, ensuring type-safe queries and complex relational mapping (e.g., Products ↔ Batches ↔ Warehouses).

---

## 2. Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Core UI** | React 18, TypeScript, Framer Motion (Animations) |
| **Styling** | Vanilla CSS (Modular Tokens), Lucide-React (Iconography) |
| **State Management** | React Outlet Context (Centralized Data Sync) |
| **API Consumer** | Axios with interceptors for auth-persistence |
| **Server** | Node.js, Express.js |
| **Persistence** | PostgreSQL, Prisma ORM |
| **Security** | Bcryptjs (Hashing), JWT (Stateless Auth) |
| **Orchestration** | NPM Workspaces, Git (Version Control) |

---

## 2.5 CI/CD Pipeline (Bitbucket Pipelines)
StoreAI implements a robust continuous integration pipeline configured via `bitbucket-pipelines.yml`:
*   **Environment**: Powered by `node:22` Docker image.
*   **Workflow**: Triggered on every push to the `main` branch.
*   **Tasks**:
    1.  **Server Build**: Installs dependencies, generates Prisma client, and compiles the backend code.
    2.  **Client Build**: Installs UI dependencies and generates the production-optimized static bundle.
*   **Artifacts**: Automatically preserves the build output in `client/dist/**` and `server/dist/**` for deployment readiness.

---

## 3. Core Functional Modules

### 📊 Dashboard & Financial Pulse
*   **Real-time Analytics**: Displays Operational Net Balance (Revenue minus Procurement).
*   **Activity Tracking**: Visual KPIs for "To-be-packed" and "To-be-shipped" logistics.
*   **Top Sellers**: Dynamic calculation of high-performing SKUs based on actual sales data.

### 📦 Inventory & Stock Intelligence
*   **Product Directory**: Supports 12+ enterprise SKUs categorized by infrastructure, networking, and peripherals.
*   **Multi-Warehouse Support**: Real-time stock distribution tracking across 3 distinct logistical hubs.
*   **Batch Tracking**: Integrated support for Batch Numbers and Expiry Dates (essential for high-value hardware or perishables).
*   **Burn Rate Prediction**: (AI) Forecasts stock-out dates based on average daily sales velocity.

### 🛍️ Procurement & Sales (The Workflow Engine)
*   **PO Lifecycle**: Moves through `DRAFT` → `APPROVED` → `SHIPPED` → `PARTIAL_RECEIVED` → `COMPLETED`.
*   **GRN (Goods Received Note)**: A specialized interface for updating warehouse stock when items physically arrive at the hub.
*   **Sales CRM**: Tracks customer interactions, invoices, and delivery statuses.

### 👥 HR & Global Ledger
*   **Unified HR**: Manage staff rosters and designations.
*   **Payroll Clerk**: Dual-mode payment processing that automatically deducts funds and posts "Withdrawal" entries to the General Ledger.
*   **General Ledger**: A comprehensive financial history tracking Credits (Sales, Investments) and Debits (Procurement, Salaries, Leases).

---

## 4. Key Workflows

### The "Pulse" Data Flow (Revenue Tracking)
1.  **Sale Creation**: User adds a new sale. The `SaleItem` records the transaction.
2.  **Revenue Entry**: The system automatically logs a `Sale` record, which reflects in the Dashboard "Total Revenue."
3.  **Financial Sync**: A corresponding `CREDIT` entry is pushed to the `Ledger` once a payment is processed.

### The "Procurement" Data Flow (Cost Tracking)
1.  **PO Creation**: A Purchase Order is drafted.
2.  **Commitment**: Upon Approval, the amount is tracked as "Total Procurement."
3.  **Inventory Update**: Using the **GRN workflow**, stock is added to a specific warehouse, creating a `Stock` record with batch details.

---

## 5. Design System (Light Enterprise)
We have implemented a **"Quantum Light"** design system prioritized for corporate demos:
*   **Palette**: Base background `#f0f4f9` (Icy Blue Slate), with Pure White (`#ffffff`) surfaces.
*   **Typography**: **'Outfit' (Google Fonts)** at a base size of **15px** for maximum readability.
*   **Responsiveness**: A specialized `responsive.css` layer handles everything from desktop widescreen to mobile smartphone views seamlessly.
*   **Contrast**: Navy Blue sidebars provide high-end anchor contrast for a premium SaaS feel.

---

## 6. Security & Operational Readiness
*   **Encrypted Access**: Password hashing prevents plain-text exposure in the database.
*   **Protected Routes**: API endpoints for creating/deleting data are guarded by an authentication middleware.
*   **Demo-Ready Seeding**: A high-volume `seed.ts` script is included to populate the logic for sales revenue and investment tracking ($100k seed capital entry).

---

### 🚀 Getting Started for Devs
1.  **Database**: Run `npx prisma migrate dev` to sync schema.
2.  **Population**: Run `npx ts-node server/prisma/seed.ts` to inject the Demo Intelligence.
3.  **Launch**: `npm run dev` in both client/server directories.
