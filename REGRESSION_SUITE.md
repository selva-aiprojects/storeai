# System Regression Test Suite - StoreAI ERP

## Overview
This document outlines the comprehensive regression test suite for the newly re-architected StoreAI ERP system. The system now includes advanced module interactions, specifically focusing on the new **Service-Oriented Architecture** (Inventory, Sales, Procurement, HR).

## Test Environment
- **Backend**: Node.js/Express (Port 5000)
- **Frontend**: React/Vite (Port 5173)
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT Bearer Token

---

## Module 1: Procurement & Inventory (The "Inward" Flow)

### Scenario 1.1: Purchase Order Lifecycle
**Description**: Verify the end-to-end flow from PO creation to Goods Inward (GRN).
- [ ] **Step 1**: Create a new Purchase Order (`POST /orders`).
    - *Input*: Supplier ID, Product ID, Quantity: 100, Unit Price: $10.
    - *Expected*: Status `DRAFT`.
- [ ] **Step 2**: Approve the PO (`PATCH /orders/:id/approve`).
    - *Expected*: Status `APPROVED`. Ledger creates "PO Commitment" (Debit) entry.
- [ ] **Step 3**: Receive Goods (GRN) (`POST /orders/:id/grn`).
    - *Input*: Warehouse ID, Batch # "BATCH-001", Expiry "2025-12-31".
    - *Expected*: 
        - Order Status updates to `COMPLETED` (or `PARTIAL`).
        - `ProductBatch` created with Qty 100.
        - `StockLedger` entry created (Type: `INWARD`).
        - Global Product Stock increased by 100.

### Scenario 1.2: Batch Tracking Verification
**Description**: Ensure stock is tracked at the batch level.
- [ ] **Step 1**: Query Inventory Summary (`GET /inventory/summary`).
    - *Expected*: View should breakdown stock by Warehouse.
- [ ] **Step 2**: Query Batch Details (Database/API check).
    - *Expected*: Find "BATCH-001" with `quantityAvailable: 100`.

---

## Module 2: Sales & Stock Deduction (The "Outward" Flow)

### Scenario 2.1: FIFO Sales Deduction
**Description**: Verify that selling a product deducts from the oldest batch first.
- [ ] **Step 1**: Ensure Product A has two batches:
    - BATCH-OLD (Qty: 10, Created: Yesterday)
    - BATCH-NEW (Qty: 50, Created: Today)
- [ ] **Step 2**: Create a Sale (`POST /sales`).
    - *Input*: Product A, Quantity: 15.
    - *Expected*:
        - BATCH-OLD `quantityAvailable` becomes 0 (Exhausted).
        - BATCH-NEW `quantityAvailable` becomes 45.
        - `SalesRegister` records two entries (10 from Old, 5 from New).

### Scenario 2.2: Dynamic Tax Calculation
**Description**: Verify GST and Tax logic during sales.
- [ ] **Step 1**: Configure Product Tax: GST 18%, Other 2%.
- [ ] **Step 2**: Create Sale for item priced $100.
- [ ] **Step 3**: Verify Response.
    - *Expected*: `taxAmount`: $20 ($18 GST + $2 Other). `totalAmount`: $120. `cgstAmount`/`sgstAmount` split correctly.

---

## Module 3: HR & Payroll

### Scenario 3.1: Attendance-Based Payroll
**Description**: Verify that payroll auto-calculates based on structure and attendance.
- [ ] **Step 1**: Setup Employee with Basic $5000, Allowance $1000.
- [ ] **Step 2**: Mark Attendance (`POST /hr/attendance`) -> 2 Days LOP (Loss Of Pay).
- [ ] **Step 3**: Generate Payroll (`POST /hr/payroll/generate`).
    - *Input*: Month "2025-05".
    - *Expected*:
        - `grossSalary`: $6000.
        - `deductions`: calculated LOP amount (e.g., $6000/30 * 2).
        - `netSalary`: Gross - Deduction.
        - Payroll record created with status `GENERATED`.

---

## Module 4: Financial Integrity (Audit)

### Scenario 4.1: General Ledger Sync
- [ ] **Step 1**: Perform a Sale (Module 2).
- [ ] **Step 2**: Perform a Purchase Approval (Module 1).
- [ ] **Step 3**: Check Ledger (`GET /accounts/ledger`).
    - *Expected*:
        - Credit entry for Sales Revenue.
        - Credit entry for Output Tax.
        - Debit entry for Purchase Cost.
        - Debit entry for Input Tax Credit.

---
 
## Module 5: Performance & Architectural Integrity
 
### Scenario 5.1: Dashboard Latency Benchmark
- [ ] **Step 1**: Trigger Dashboard Stats (`GET /dashboard/stats`).
- [ ] **Step 2**: Verify Response Time < 200ms for concurrent statistical data.
- [ ] **Step 3**: Verify single-pass aggregation logic (Server log check).
 
### Scenario 5.2: Product Visual Catalog (Showroom)
- [ ] **Step 1**: Create Product with `image` data (Base64/URL).
- [ ] **Step 2**: Verify retrieval in product list.
- [ ] **Step 3**: Verify showroom mode visual render (Manual).
 
---
 
## Module 6: UI Resilience
- [ ] **Hotkey [F2] Verification**: Ensure F2 triggers sales modal globally.
- [ ] **Sidebar Coherence**: Verify "Billing & Accounts" label and functionality.
- [ ] **Header Synergy**: Verify "New Artifact" button maps correctly based on path.
 
---
 
## Automation Strategy
**Tooling**: Playwright (E2E) + Jest/Supertest (API).
**CI/CD**: Run suite on Pull Request.

### Critical Path Smoke Test (node script)
A script `scripts/smoke_test.ts` can be added to run the following sequence:
1. Create Product -> 2. Inward Stock -> 3. Sell Stock -> 4. Verify Ledger.
