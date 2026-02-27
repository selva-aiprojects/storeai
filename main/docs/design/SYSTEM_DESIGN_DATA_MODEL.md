# Comprehensive System Design & Data Architecture
## Inventory, Sales, Procurement, and HR Management System

This document outlines the data architecture, normalized data model, and system workflows to support the end-to-end management of the business.

---

## 1. Procurement & Inventory Workflow

### A. Supplier/Vendor Management
**Workflow:**
1.  **Onboarding**: Create Supplier Master with reliability scores and status.
2.  **Agreements**: Define pricing agreements (contract pricing) for specific products.

**Data Model Enhancements:**
-   **Supplier**: Add `reliabilityScore`, `paymentTerms`, `taxId`.
-   **SupplierAgreement** (New): Track product-specific prices agreed with vendors.
    -   Fields: `supplierId`, `productId`, `agreedPrice`, `startDate`, `endDate`.

### B. Purchase Order Lifecycle
**Workflow:**
1.  **Requisition**: System or Staff triggers a `PurchaseRequisition` when stock is low.
2.  **Quotation**: Request quotes from suppliers (`PurchaseQuotation`).
3.  **Purchase Order (PO)**: Convert approved quote to PO (`Order`). Status: `CREATED` -> `APPROVED` -> `SHIPPED` -> `INWARD` -> `CLOSED`.
4.  **Inward Entry**: On receiving goods, create `GoodsReceipt` (GRN).
    -   Update `Stock` levels.
    -   Track Batch/Expiry.

**Data Model Enhancements:**
-   **PurchaseRequisition** (New): `requestedBy`, `status` (PENDING, APPROVED, REJECTED), `items`.
-   **PurchaseQuotation** (New): `requisitionId`, `supplierId`, `totalAmount`, `status` (RECEIVED, ACCEPTED, REJECTED).
-   **Order**: Link to `quotationId`. Add statuses (`INWARD`, `CLOSED`). Existing `GoodsReceipt` handles inward entry.

### C. Stock Management
**Workflow:**
-   **Real-time Tracking**: Stock is updated on `GoodsReceipt` (Increase) and `Sale` (Decrease).
-   **Batch/Expiry**: tracked in `Stock` table.
-   **Reorder Logic**:
    -   Job runs daily check: `IF (Stock.quantity + OnOrder.quantity) < Product.reorderLevel THEN Create PurchaseRequisition`.

---

## 2. Sales & POS Workflow

### A. Product Pricing
**Workflow:**
-   **Base Price**: Stored in `Product`.
-   **Tax**: Define GST slabs (CGST, SGST, IGST) in `Product` or `TaxRule`.
-   **Dynamic Pricing**: Region-wise or Segment-wise pricing using `PricingRule`.

**Data Model Enhancements:**
-   **Product**: `taxSlabId` (or keep `gstRate`).
-   **PricingRule**: Add `customerSegment` (VIP, RETAIL, WHOLESALE) and `region`.

### B. POS Billing System
**Workflow:**
1.  **Cart**: Add items.
2.  **Calc**: Apply Discounts -> Calc Tax (Split CGST/SGST/IGST based on Customer State vs Company State) -> Total.
3.  **Payment**: Capture split payments (Cash + Card).
4.  **Invoice**: Generate `Sale` record.

**Data Model Enhancements:**
-   **Sale**: `salesmanId` (Employee), `paymentStatus`.
-   **SaleItem**: `cgstAmount`, `sgstAmount`, `igstAmount`, `discountAmount`.

### C. Sales Transactions
-   **Salesman**: Linked to `Employee`.
-   **History**: Query `Sale` by `customerId`.

---

## 3. Automated Reorder Process

**Workflow Logic:**
1.  Trigger: Scheduled Job or Event Listener on Stock Update.
2.  Condition: `CurrentStock <= ReorderLevel`.
3.  Action:
    -   Generate `PurchaseRequisition` (Status: AUTO_GENERATED).
    -   Notify Procurement Team (Email/Notification).
4.  Follow-up: Procurement converts Requisition -> Quote -> PO.

---

## 4. HR & Payroll System

### A. Employee Master
**Data Model:**
-   **Employee**: `departmentId`, `designation`, `doj`, `status`, `bankDetails`, `pan`, `uan`.

### B. Attendance Management
**Workflow:**
-   **Daily**: `CheckIn` / `CheckOut`.
-   **Logic**:
    -   Late Mark: `CheckIn > ShiftStartTime + GracePeriod`.
    -   Overtime: `WorkHours > ShiftHours`.
    -   Leaves: Link to `LeaveApplication`.

**Data Model Enhancements:**
-   **Attendance**: `lateMinutes`, `isHalfDay`.
-   **Leave**: `employeeId`, `type`, `startDate`, `endDate`, `status`.

### C. Salary & Payroll
**Workflow:**
1.  **Structure**: Define `SalaryStructure` (Basic, HRA, DA, etc.) for each employee.
2.  **Process**:
    -   Calc `Gross`: Sum components.
    -   Calc `Deductions`: Tax + PF + LOP (Based on Attendance).
    -   `Net = Gross - Deductions`.
3.  **Payslip**: Generate record in `Payroll`.

**Data Model Enhancements:**
-   **SalaryStructure** (New): `employeeId`, `basic`, `hra`, `allowances`.
-   **Payroll**: `basic`, `hra`, `allowances`, `deductions`, `lopAmount`, `taxAmount`, `netSalary`.

---

## 5. Multi-Tenant Core Architecture

StoreAI is designed as a **Shared Database, Shared Schema** multi-tenant application. Logical isolation is maintained at the application and data-access layers.

### A. Data Isolation
Every table in the database contains a `tenantId` field. 
- **Persistence**: Prisma middleware automatically injects the active `tenantId` into all `find`, `create`, `update`, and `delete` operations.
- **Reporting**: SQL Views (e.g., `Reporting_CurrentStock`) include the `tenantId` column to allow for performant, isolated aggregations.

### B. RBAC & Identity
Roles are defined in a hierarchical structure across the platform:
1.  **Superadmin**: Global access. Can manage tenant records, monitor platform-wide health, and perform cross-tenant system maintenance.
2.  **Admin (Owner)**: Full access within a specific tenant. Manages store settings, staff, and financial configurations.
3.  **Staff**: Functional access within a specific tenant (e.g., Cashier, Inventory Manager). Masked from sensitive financial summaries where required.

### C. Tenant Onboarding Workflow
1.  **Registration**: New `Tenant` record created with a unique `id`.
2.  **Seeding**: Default categories, tax slabs, and a primary Admin user are initialized for the new `tenantId`.
3.  **Identity**: The tenant is assigned a unique sub-domain or isolation identifier for login branding (`logo-mt.png`).

---

## 6. Reporting & Analytics (Views)

To be implemented as Native SQL Views with mandatory `tenantId` scoping:

1.  **Inventory Aging**: `SELECT product, batch, DATEDIFF(now, receivedDate), "tenantId" FROM Stock ...`
2.  **Reorder Alerts**: `SELECT * FROM Product WHERE "stockQuantity" < "lowStockThreshold" AND "tenantId" = '...'`.
3.  **Sales Revenue**: Group `Sale` by `month`, `salesman`, `product`, and `tenantId`.
4.  **Payroll Report**: Summary of `Payroll` table scoped to `tenantId`.
