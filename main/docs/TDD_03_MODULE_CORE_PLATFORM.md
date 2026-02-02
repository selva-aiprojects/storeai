# StoreAI Technical Design - Core Platform Module
**Document ID:** TDD-003
**Module:** Core (Node.js/React)
**Version:** 1.0
**Status:** Approved

---

## 1. Module Overview
The **Core Platform** is the backbone of StoreAI, handling all business transactions, user interfaces, and data persistence. It encompasses the web frontend (User Experience) and the transactional backend (Business Logic).

**Key Domains:**
- Inventory Management (GRN, Stock adjustments).
- Sales & Point of Sale (POS).
- Accounting (Double-entry ledger, Daybook).
- Human Resources (Attendance, Payroll).

---

## 2. Frontend Architecture (Client)

### Technology Stack
- **Framework**: React.js (Vite Build System)
- **Language**: TypeScript (Strict Mode)
- **UI Library**: TailwindCSS + Lucide Icons

### Component Hierarchy
- **`Layout/`**: `DashboardLayout` provides the persistent sidebar and header shell.
- **`Pages/`**: Route-based components (e.g., `Inventory.tsx`, `Sales.tsx`).
- **`Components/`**: Reusable UI atoms (Cards, Tables, Modals).
- **`Services/`**: API integration layer using `Axios` interceptors for automatic token injection.

### State Management
- **Auth Context**: Manages User Session and Tenant ID globally.
- **Local State**: `useState` for transient form data.
- **Data Fetching**: `useEffect` hooks trigger service calls on mount.

---

## 3. Backend Architecture (Server)

### Technology Stack
- **Runtime**: Node.js
- **Server**: Express.js
- **DB Interface**: Prisma Client (ORM)

### Layered Design
1.  **Routes (`/routes`)**: Defines API endpoints (e.g., `/api/sales`).
2.  **Controllers (`/controllers`)**: Handles HTTP Request/Response lifecycle and input validation.
3.  **Services (`/services`)**: Contains pure business logic.
    - *Example*: `SalesService.createSale()` handles stock deduction, ledger entry creation, and invoice generation atomically.
4.  **Middleware**:
    - `authMiddleware`: Verifies JWT and extracts `user` and `tenantId`.
    - `errorHandler`: Global exception catching.

---

## 4. Database Schema Design (PostgreSQL)

The database captures the complex relationships of an ERP system.

### Core Entities
- **Tenant**: Root entity. All other data is linked to a Tenant.
- **User**: System access credentials and Role (ADMIN, MANAGER).
- **Product**: Catalog items (`name`, `sku`, `price`).
- **Sale / SaleItem**: Transactional headers and line items.
- **InventoryTransaction**: Audit trail of all stock movements (IN/OUT).

### Accounting Module (Double-Entry)
- **LedgerAccount**: Represents financial entities (e.g., "Sales Account", "Cash", "Bank").
- **JournalEntry**: A financial event (linked to a Sale or Purchase).
- **JournalLine**: The Debit/Credit splits.
    - *Rule*: Total Debits must equal Total Credits for every JournalEntry.

---

## 5. Security & Isolation

### Multi-Tenant Isolation
Currently implemented via **Logical Separation**:
- Every table has a `tenantId` column.
- Prisma Middleware auto-injects `where: { tenantId }` into queries to prevent cross-tenant data leaks.

### Authentication Flow
1.  **Login**: User posts credentials to `/api/auth/login`.
2.  **Visual**: Server validates hash, issues signed JWT (Expiry: 24h).
3.  **Access**: Client attaches JWT `Authorization: Bearer <token>` to all subsequent requests.
