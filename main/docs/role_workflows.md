# StoreAI Enterprise: Role-Based Workflows & Architecture

## Tech Stack & Architecture

### 1. Technology Stack
The StoreAI Enterprise system is built on a modern, scalable stack designed for high performance and maintainability.

**Frontend (Client)**
*   **Framework**: React 18 with Vite (for fast build times and HMR).
*   **Language**: TypeScript (for type safety and developer experience).
*   **Styling**: Tailwind CSS (utility-first CSS) with custom unified theme variables.
*   **UI Components**: Lucide React (icons), Framer Motion (animations), Recharts (analytics visualization).
*   **State Management**: React Hooks and Context API.
*   **Routing**: React Router DOM v6.
*   **HTTP Client**: Axios.

**Backend (Server)**
*   **Runtime**: Node.js with Express.js framework.
*   **Language**: TypeScript.
*   **Database ORM**: Prisma (for type-safe database queries and schema management).
*   **Database**: PostgreSQL (relational database for robust data integrity).
*   **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
*   **Logging**: Winston with Morgan (for comprehensive application and HTTP logging).
*   **Compression**: Gzip compression for optimized payload delivery.

### 2. System Architecture
The application follows a **Monolithic Layered Architecture** with a clear separation of concerns, ensuring scalability and ease of testing.

*   **Client-Server Model**:
    *   The **Client** (SPA) handles the UI/UX and communicates with the server via a RESTful API.
    *   The **Server** exposes versioned endpoints (`/api/v1/*`) to handle business logic and data persistence.

*   **Backend Layering**:
    1.  **Routes Layer**: Defines API endpoints and maps them to controllers (e.g., `authRoutes`, `productRoutes`).
    2.  **Middleware Layer**: Handles cross-cutting concerns like Authentication (`authMiddleware`), Audit Logging (`auditMiddleware`), and Error Handling.
    3.  **Controller Layer**: Processes incoming requests, validates input, and orchestrates business logic.
    4.  **Service Layer**: (Implicit/Explicit) Contains the core business rules and reusable functions.
    5.  **Data Access Layer**: Uses **Prisma Client** to interact with the PostgreSQL database.

*   **Security & Multi-Tenancy**:
    *   **Role-Based Access Control (RBAC)**: Fine-grained permissions (e.g., `inventory:read`, `hr:write`) assigned to Roles, which are assigned to Users.
    *   **Multi-Tenancy**: Built-in support for multiple tenants (organizations) sharing the same infrastructure but with data isolation enforced at the database level (via `tenantId`).

### 3. Key Modules & Workflows
*   **Authentication**: Secure login with JWT and role verification.
*   **Inventory & Products**: SKU management, stock tracking, and batch/tracking functionality.
*   **Trade & Logistics**: Sales (POS), Home Delivery, and Procurement.
*   **HR & Payroll**: Employee management, attendance tracking, and salary disbursement.
*   **Finance**: General ledger, daybook, and financial reporting.

---

## Role-Based Workflows
This section outlines the key workflows for each role in the **StoreAI Enterprise** system. The workflows are demonstrated using the `admin@storeai.com` account, which possesses the `SUPER_ADMIN` role and has access to all modules.

## Tenant Context
- **Tenant**: StoreAI Corporate Hub
- **User**: System Administrator
- **Role**: Super Admin (Permissions: `dashboard:view`, `inventory:*`, `sales:*`, `hr:*`, `accounts:*`, `reports:view`)

---

## 1. Role: HR Manager
**Responsibility**: Managing employee lifecycles, attendance, and performance.

### Workflow: Staffing (Add Employee)
1.  **Navigate** to `Workforce & HR` > `Employee Master`.
2.  **Action**: Click the **Add Employee** button.
3.  **Input**: Enter First Name, Last Name, Designation, Department, and Salary.
4.  **Outcome**: A new employee record is created in the `Employee` database table.

> *[Screenshot Placeholder: Employee Master List View]*

### Workflow: Attendance & Performance
1.  **Navigate** to `Workforce & HR` > `Attendance Master`.
2.  **Action**: Locate an employee in the daily roster.
3.  **Action**: Click **Presence** to mark them as Present for the day.
4.  **Action**: Hover over the **Performance** column.
5.  **Input**: Select a star rating (1-5) based on daily output.
    -   5 Stars: Exceptional
    -   3 Stars: Standard
    -   1 Star: Critical Gap
6.  **Outcome**: Attendance and performance data are logged for payroll calculation.

> *[Screenshot Placeholder: Attendance Roster with Performance Stars]*

---

## 2. Role: Procurement Manager
**Responsibility**: Sourcing products and managing supplier orders.

### Workflow: Purchase Requisition & Order
1.  **Navigate** to `Trade & Logistics` > `Procurement Hub`.
2.  **Action**: Click **New Order**.
3.  **Input**: 
    -   Select Supplier (e.g., "Main Distribution Co.").
    -   Add Products (e.g., "Enterprise Router X1").
    -   Set Quantity (e.g., 10 units).
4.  **Action**: Click **Create Order**.
5.  **Outcome**: A Purchase Order (PO) is generated with status `PENDING` or `APPROVED`.

> *[Screenshot Placeholder: New Purchase Order Form]*

---

## 3. Role: Warehouse Manager
**Responsibility**: Receiving stock and managing inventory.

### Workflow: Inbound Tracking (Goods Receipt)
1.  **Navigate** to `Procurement Hub` > `Purchase Orders`.
2.  **Action**: Select the `APPROVED` Purchase Order.
3.  **Action**: Click **Receive Goods / GRN**.
4.  **Input**: Confirm the quantity received and assign a Batch Number (e.g., `BATCH-2024-001`).
5.  **Outcome**: Stock levels for the product increase in the default warehouse.

> *[Screenshot Placeholder: Goods Receipt Note (GRN) Entry]*

---

## 4. Role: Sales Staff
**Responsibility**: Processing customer sales and transactions.

### Workflow: Home Delivery Sale
1.  **Navigate** to `Trade & Logistics` > `Sales [POS]`.
2.  **Action**: Click **New Sale**.
3.  **Input**:
    -   Select Customer: "Regular Retail Customer".
    -   **Toggle**: Check the "Home Delivery" option.
    -   Confirm Delivery Address.
    -   Scan/Select Product: "Enterprise Router X1".
4.  **Action**: Click **Process Payment** and complete the transaction.
5.  **Outcome**: A Sale record is created with `isHomeDelivery: true`.

> *[Screenshot Placeholder: POS Terminal with Home Delivery Toggle]*

---

## 5. Role: Logistics Coordinator
**Responsibility**: ensuring orders reach customers.

### Workflow: Outbound Fulfillment
1.  **Navigate** to `Trade & Logistics` > `Sales [POS]` (Sales History).
2.  **Action**: Filter by "Home Delivery" or find the recent sale.
3.  **Action**: Click **Ship / Dispatch**.
4.  **Input**: Enter **Tracking Number** and **Carrier Name**.
5.  **Action**: Save.
6.  **Outcome**: The order status updates to `SHIPPED`.

> *[Screenshot Placeholder: Dispatch/Shipment Modal]*

---

## 6. Role: System Administrator
**Responsibility**: Managing users and system configuration.

### Workflow: System Access
1.  **Navigate** to `Platform Control` > `Tenant Settings` or `Administration`.
2.  **Action**: View the **User Management** section.
3.  **Action**: Manage roles and permissions for other users.
4.  **Outcome**: Updates to user access levels.

> *[Screenshot Placeholder: Admin Settings Dashboard]*
