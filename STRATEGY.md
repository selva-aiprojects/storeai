# StoreAI Synthetic Dataset & Data Enablement Plan

## 1. Project Objective
Generate a high-fidelity, commercially realistic transactional dataset for the "StoreAI" platform. This dataset will span one full year (365 days) and cover 5 distinct tenants, simulating daily business operations including purchasing, inventory management, sales, and financial tracking. The goal is to provide a rich foundation for training/testing an LLM for retail analytics.

## 2. Scope & Scale
- **Timeframe**: Last 365 days (ending `2026-01-29`).
- **Tenants**: 5 (GastroGlore, Lumina Home, HealthFirst, UrbanStyle, TechNova).
- **Volume**: 
  - ~2,500 Sales per tenant (~12,500 total).
  - ~500 Purchase Orders per tenant.
  - Thousands of distinct stock movements (adjustments, goods receipts).

## 3. Data Generation Logic

### A. Reference Data (Pre-requisites)
*Utilize existing `seed_real_world_data.ts` to populate:*
- Tenants, Users, Roles.
- Suppliers, Customers, Categories.
- Products (Base catalog).

### B. Simulation Loop (Day-by-Day Execution)
The script `seed_transactions.ts` will iterate from `StartDate` to `EndDate`.

#### Daily Operations:
1.  **Inventory Check (Morning)**
    - Check stock levels for all products.
    - **Logic**: If `current_stock` <= `reorder_point`, generate **Purchase Order (PO)**.
    - **Anomaly**: 5% chance to *delay* reordering (simulate oversight).

2.  **Receiving / Inward (Mid-Day)**
    - Check pending POs with `expectedDeliveryDate` <= `today`.
    - **Action**: Create **GoodsReceipt (GRN)**.
    - **Stock Update**: Create `ProductBatch` and `StockLedger` (INWARD).
    - **Anomaly - Delays**: 10% of POs arrive 2-5 days late.
    - **Anomaly - Expiry**: For 'HealthFirst' & 'GastroGlore', 5% of batches arrive with short shelf life or near expiry.

3.  **Sales Simulation (Through the Day)**
    - Generate 5-12 **Sales Orders / Invoices** per tenant.
    - **Selection**: partial random selection of products (80% popular items, 20% slow movers).
    - **Logic**:
        - Check stock. If insufficient, record `LostSale` (internal metric) or prevent sale.
        - Create `Sale` and `SaleItem`.
        - Create `SalesRegister` and `StockLedger` (SALE) entries.
        - Deduct from `Stock` and specific `ProductBatch`.
    - **Anomaly - Spikes & Drops**:
        - **Spike**: Random 3-day period with 2x sales (e.g., "Holiday Sale").
        - **Drop**: Random 1-week period with 50% sales (e.g., "Supply Chain Issue" or "Off-season").

4.  **Financials (End of Day)**
    - **Accounts Receivable**: Record `Payment` for Sales.
        - 90% Immediate (Cash/Card).
        - 10% Credit (Payment recorded 15-30 days later).
    - **Accounts Payable**: Pay Suppliers.
        - Randomly mark POs/Invoices as PAID or PENDING.

### C. Specific Scenarios for LLM Training (Anomalies)
| Scenario | Implementation Detail | Target Query |
| :--- | :--- | :--- |
| **Critical Stock** | Force high sales on specific SKU without reorder. | "Which items need reorder today?" |
| **Dead Stock** | Products with 0 sales for last 90 days. | "Show slow-moving inventory." |
| **Expiry Risk** | `ProductBatch` with `expiryDate` < `Today + 30 days` & `quantity` > 0. | "Products expiring this month." |
| **Vendor Delay** | `GoodsReceipt` date >> `Order.expectedDeliveryDate`. | "Suppliers with delayed deliveries." |
| **High Margin** | Products with `Price` > 3x `Cost`. | "High revenue, low margin products." |
| **Loss Makers** | Products with deep discounts (`SaleItem.unitPrice` < `Product.costPrice`). | "Loss-making products." |
| **Return Patterns**| Create `StockLedger` (RETURN) entries for specific Customers. | "Items with high returns." |

## 4. Implementation Strategy
1.  **`scripts/seed_transactions.ts`**:
    - Standalone script importing Prisma.
    - Helper functions: `createPO()`, `receiveGoods()`, `generateSale()`.
    - Main loop interacting with `seed_real_world_data` setup.
2.  **Execution**:
    - Run `seed_real_world_data` first (ensure base data).
    - Run `seed_transactions` to layer on the history.

## 5. Output Verification
- **Dashboard**: Login to StoreAI and view charts.
- **SQL Checks**:
    - `SELECT count(*) FROM "Sale";`
    - `SELECT count(*) FROM "ProductBatch" WHERE "expiryDate" < NOW();`
