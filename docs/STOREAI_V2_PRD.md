# StoreAI V2.0 — Product Requirements Document (PRD)
**AI-Powered Unified Retail & Commerce Operating System**

---

## 1. Document Control & Metadata

| Attribute | Specification |
| :--- | :--- |
| **Product Name** | **StoreAI** (Version 2.0) |
| **Document Classification** | Engineering & Product Specification / Operational Standard |
| **Product Owner** | Cognivectra Product Strategy & Architecture Team |
| **Benchmark Standard** | **Optech Enterprise Retail Standard** (POS, Hardware, GST, Offline Sync, Tally) |
| **Target Market** | Indian SMB Retailers, Supermarkets, Multi-Branch Chains, Wholesalers & Distributors |
| **Document Status** | Approved for Execution / Phased Implementation |
| **Release Strategy** | Phase 1 (Retail Core MVP) $\rightarrow$ Phase 2 (Omnichannel & GST) $\rightarrow$ Phase 3 (AI Action Engine) $\rightarrow$ Phase 4 (Enterprise Integration) |

---

## 2. Executive Summary & Strategic Benchmark

### 2.1 The Strategic Shift
Traditional Indian retail POS solutions (e.g., Optech, Vyapar, Marg, Tally-based add-ons) excel in ground-level operational mechanics—keyboard shortcuts, thermal printing, batch/MRP handling, offline cashier shifts, and GSTR reporting. However, they suffer from legacy desktop architectures, lack of real-time multi-branch synchronization, non-existent omnichannel capabilities, and zero predictive intelligence.

Conversely, early-stage modern cloud apps offer sleek UIs and multi-tenancy but fail under real-world retail pressure (slow barcode lookups, lack of offline reliability, poor thermal printer support, and incomplete statutory compliance).

**StoreAI V2.0 bridges this gap by adopting Optech’s operational retail maturity as the baseline standard while utilizing cloud-native multi-tenancy, real-time omnichannel synchronization, and an AI-driven System of Action as the core market differentiators.**

```
Traditional POS (Optech)       StoreAI V2.0 (Unified Commerce OS)
┌───────────────────────────┐    ┌──────────────────────────────────────────────┐
│  • Ground Billing         │    │  • Optech-Grade Ground Billing & Hardware    │
│  • Desktop / Local File   │ +  │  • Offline-First Sync + Multi-Tenant Cloud   │
│  • Manual Accounting/Data │    │  • Native Omnichannel (POS + Web + WhatsApp) │
│  • Reactive Reports       │    │  • AI Copilot: Record → Intelligence → Action│
└───────────────────────────┘    └──────────────────────────────────────────────┘
```

---

### 2.2 StoreAI vs. Optech Standards: Gap Analysis & Target Parity

| Operational Domain | Optech Baseline Standard | StoreAI V1 Status | StoreAI V2.0 PRD Target | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **High-Speed POS Billing** | Keyboard shortcuts, sub-2s scan-to-cart, hold/recall bills, line item discounts | Web UI, touch-focused, mouse-dependent | Optech parity: Full keyboard shortcut suite, instant barcode scanning, multi-tab hold carts | **P0** |
| **Hardware & Peripherals** | ESC/POS thermal printers (2"/3"), USB/BT scanners, weighing scales, cash drawers | Browser print dialog (A4/basic thermal) | Direct WebUSB/WebSerial/ESC-POS raw printing, pole displays, weighing scale COM support | **P0** |
| **Batch, Expiry & Multi-MRP** | Multi-MRP on same barcode, FEFO/FIFO batch tracking, expiry dump | Single MRP per SKU, basic batches | Strict Multi-MRP, batch-level costing, automated FEFO allocation at billing | **P0** |
| **Cashier Shift Reconciliation** | Shift open, cash float, mid-day drawer drop, X/Z settlement reports | Basic daily summary | Full Cashier Shift Cycle: Float declaration, physical cash tally, variance audit, Z-Report | **P0** |
| **Offline Resilience** | 100% offline desktop-native | Requires internet connectivity | Offline-First (IndexedDB/PWA cache), transaction queuing, auto background sync | **P0** |
| **GST Compliance & Invoicing** | B2B/B2C invoices, HSN summary, GSTR-1, GSTR-3B export | Basic GST rate calculation | Full Indian GST suite, e-Invoicing (IRN API), e-Way Bill JSON, GSTR-1/3B exports | **P0** |
| **Tally / Accounting Bridge** | Native Tally XML export / ODBC sync | Manual entry | Automated Tally XML Daybook / Sales / Purchase export & direct REST integration | **P1** |
| **Omnichannel & Web Store** | Third-party or absent | Separate module | Unified single inventory pool: Store POS + Web Storefront + WhatsApp Catalog | **P1** |
| **Predictive AI & Automation** | Absent (static historical reports) | Basic stock alerts | AI Demand Forecasting, Auto Reorder PO generator, Dead-Stock liquidation engine | **P2** |

---

## 3. Product Vision, Architecture & Operating Philosophy

### 3.1 The Product Philosophy: The 3-Tier Enterprise Loop

StoreAI operates across three interconnected layers:
1. **System of Record**: High-throughput transaction recording (POS, Purchases, GRN, GST, Accounting, Stock Movements).
2. **System of Intelligence**: Continuous analysis of velocity, margins, vendor lead times, seasonal demand, and customer retention.
3. **System of Action**: Autonomous execution with human approval (Auto PO generation, WhatsApp win-back campaigns, markdown recommendations).

```
   ┌────────────────────────────────────────────────────────────────────────┐
   │                        SYSTEM OF RECORD                                │
   │  POS Billing • Warehouses • Purchases • GST Ledger • Customer Dues    │
   └──────────────────────────────────┬─────────────────────────────────────┘
                                      │ Event Stream / Data Sync
                                      ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                      SYSTEM OF INTELLIGENCE                            │
   │  Demand Forecast • Stockout Probability • Anomaly Detection • Trends   │
   └──────────────────────────────────┬─────────────────────────────────────┘
                                      │ Recommended Next Best Actions
                                      ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                        SYSTEM OF ACTION                                │
   │  1-Click Purchase Orders • WhatsApp Promotions • Dynamic Discounting   │
   └────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Target Customer Segments & Use Cases

| Segment | Profile | Core Operational Pain Point | StoreAI V2 Solution |
| :--- | :--- | :--- | :--- |
| **Segment A: High-Footfall Single Store** | Supermarkets, Kirana, Pharmacies, Apparel (1–2 billing counters) | Counter queues, price lookup delays, thermal printer jams, internet outages. | Sub-5 second checkout, keyboard-only billing, offline POS caching, instant ESC/POS receipt generation. |
| **Segment B: Growing Multi-Outlet Retailer** | 3–15 stores across city/region with central warehouse | Stock imbalances, lack of branch visibility, manual stock transfers, pilferage. | Real-time multi-branch stock ledger, Transfer Orders (STN/GRN workflow), consolidated analytics, centralized pricing. |
| **Segment C: Wholesaler & Distributor** | B2B FMCG, Hardware, Electronics distribution | Customer credit limits, route sales, party ledgers, e-Way bills, bulk pricing. | Party ledger management, credit limits with overdue blocking, e-Way bill automation, salesman order routing. |
| **Segment D: Modern Omnichannel Brand** | D2C brands, Boutique retail | Disconnected online orders (Shopify/Woo) vs. offline store inventory. | Single inventory engine for physical POS + Web Storefront + WhatsApp ordering. |

---

## 5. Detailed Functional Requirements

---

### Module 1: High-Speed Retail POS & Cashier Station (Optech Standard)
*Priority: P0 (Core Foundation)*

#### 1.1 Billing Mechanics & User Interface
- **Keyboard-Driven Workflow**: Complete billing without touching a mouse.
  - `F1`: Search Product | `F2`: Change Qty | `F3`: Apply Discount | `F4`: Hold Bill | `F5`: Recall Bill | `F8`: Payment Window | `F12`: Print & Settle | `Esc`: Cancel/Clear.
- **High-Velocity Barcode / QR Scanning**: Instant scan handling (`<100ms` debounce). Support for 1D/2D barcodes, EAN-13, UPC, Code 128, and GS1 DataBar.
- **Multiple Open Carts (Hold/Recall)**: Ability to hold up to 10 concurrent customer transactions on a single terminal when a customer pauses checkout.
- **Multi-MRP Selection**: If a single barcode has multiple MRPs/Batches, present a fast keyboard popup to choose the active batch/MRP.
- **Salesperson Tagging**: Optional or mandatory salesperson ID per invoice or per line-item for commission calculation.

#### 1.2 Payment & Settlement Engine
- **Multi-Tender Split Payments**: Support simultaneous combinations of:
  - Cash (with change return calculator)
  - Dynamic UPI QR (Display dynamic QR on screen/pole display with exact bill amount via UPI intent)
  - Credit/Debit Card (reference number capture)
  - Customer Store Credit / Udhar Ledger (with credit limit validation)
  - Loyalty Points Redemption & Gift Vouchers
- **Partial Payment & Credit Sales**: Instant customer ledger updating with automatic SMS/WhatsApp balance notification.

#### 1.3 Cashier Shift Management & Reconciliation (X/Z Reports)
- **Shift Opening**: Cashier enters opening float cash.
- **Cash Drops / Petty Expenses**: Record cash drawer ins/outs during the shift with mandatory reason codes.
- **Shift Closing (Z-Report)**:
  - Blind close option (cashier counts cash before seeing system totals to prevent fraud).
  - Detailed reconciliation: Expected Cash vs. Actual Cash $\rightarrow$ Over/Short discrepancy logging.
  - Z-Report printout on thermal printer summarizing Sales, Returns, Taxes, Discounts, and Tender breakup.

---

### Module 2: Offline-First POS Engine & Synchronization
*Priority: P0 (Operational Continuity)*

```
                   ONLINE MODE                              OFFLINE MODE
┌──────────────────────────────────────────────┐  ┌───────────────────────────────────┐
│ Client UI ──► Cloud API ──► Central Database │  │ Client UI ──► Local IndexedDB     │
│       ▲                            │         │                       │               │
│       └──── WebSockets Delta Sync ─┘         │  Local Queue: [TX_001, TX_002, ...]   │
└──────────────────────────────────────────────┘  └─────────────────┬─────────────────┘
                                                                    │ Internet Restored
                                                                    ▼
                                                  Sync Engine ──► Cloud Conflict Resolver
```

- **Local Transaction Store**: Uses browser `IndexedDB` / SQLite via Local PWA storage. All product masters, barcodes, prices, customer lists, and active discounts are cached locally.
- **Zero-Block Offline Billing**: When the network drops, billing continues seamlessly with zero UI delay. Invoices receive a deterministic temporary offline ID (`OFF-<TerminalID>-<Timestamp>-<Seq>`).
- **Deterministic Delta Sync & Conflict Resolution**:
  - Automatically batches and syncs queued offline transactions when connectivity is restored.
  - Stock decrement uses sequential cloud reconciler with optimistic locking to prevent negative stock inconsistencies.

---

### Module 3: Inventory Master, Batch, Expiry & Multi-MRP (Optech Standard)
*Priority: P0 (Inventory Accuracy)*

#### 3.1 Item Master Architecture
- **Hierarchical Attributes**: Category $\rightarrow$ Sub-Category $\rightarrow$ Brand $\rightarrow$ Item Name $\rightarrow$ Variant (Size, Color, Flavour).
- **Dual Unit of Measure (UOM)**: Primary UOM (e.g., Box, Bag) and Secondary UOM (e.g., Pcs, Kg) with conversion factors.
- **Tax Configuration**: HSN/SAC Code, CGST %, SGST %, IGST %, Cess %.
- **Pricing Matrix**: Purchase Cost Price, Landing Cost (including freight/charges), Wholesale Price, Minimum Selling Price (MSP), and Maximum Retail Price (MRP).

#### 3.2 Batch & Expiry (FIFO/FEFO Engine)
- **Batch Tracking**: Capture Batch Number, Manufacturing Date, Expiry Date, and Purchase Price per batch.
- **FEFO (First Expiry, First Out) Enforcement**: POS automatically suggests/allocates the oldest non-expired batch.
- **Near-Expiry Warning Dashboard**: Configurable alerts for products expiring in 30/60/90 days with one-click return-to-vendor (RTV) or markdown creation.
- **Serial & IMEI Number Management**: Mandatory serial number capture during GRN and POS checkout for electronics and mobile devices.

---

### Module 4: Multi-Branch & Multi-Warehouse Logistics
*Priority: P0 (Enterprise Operations)*

#### 4.1 Stock Transfer Order (STN / GRN Workflow)
```
[Branch A: Store] ──► Create Transfer Request (INDENT)
         │
         ▼
[Central Warehouse] ──► Approve & Dispatch (Stock Transfer Note - STN)
         │              ↳ Stock status: IN-TRANSIT
         ▼
[Branch A: Store] ──► Physical Verification & Receive (GRN)
                        ↳ Damaged/Shortage logged ──► Final Stock In
```

- **Stock Reservation**: Dispatched items are immediately reserved and removed from the dispatching warehouse's available-to-sell pool.
- **Transit Discrepancy Logging**: If dispatched quantity $\neq$ received quantity, the system generates a discrepancy variance voucher requiring manager authorization.
- **Inter-Branch Stock Visibility**: POS operators can view live stock availability across neighboring branches to fulfill customer requests or initiate store pickups.

---

### Module 5: Procurement & Vendor Lifecycle Management
*Priority: P0 (Supply Chain)*

- **Purchase Workflow**:
  $$\text{Purchase Requisition (Indent)} \longrightarrow \text{Purchase Order (PO)} \longrightarrow \text{Goods Receipt Note (GRN)} \longrightarrow \text{Purchase Invoice} \longrightarrow \text{Vendor Payment}$$
- **Landed Cost Allocation**: Allocate freight, unloading charges, and customs duties across received items to calculate the true Unit Landed Cost.
- **Vendor Rate Contracts**: Record negotiated item rates per vendor with historical purchase price variance (PPV) tracking.
- **Purchase Returns (Debit Note)**: Support returns for damaged, expired, or unsold inventory with automatic GST Debit Note generation.

---

### Module 6: Indian Taxation, E-Invoicing, E-Way Bill & Tally Bridge
*Priority: P0 / P1 (Regulatory & Accounting Compliance)*

#### 6.1 Indian GST Compliance
- **Tax Invoicing**: Fully compliant GST Tax Invoices showing Seller & Buyer GSTIN, State Code, Place of Supply, HSN summary, and Tax breakdown (CGST, SGST, IGST).
- **Statutory Returns Export**:
  - **GSTR-1**: Ready-to-upload JSON and Excel tables (B2B, B2CL, B2CS, CDNR, HSN summary, Document summary).
  - **GSTR-3B**: Summary computation of Outward Supplies, Eligible ITC, and Ineligible ITC.
  - **GSTR-2B Reconciliation**: Match vendor purchase invoices against GSTR-2B portal data to detect missing ITC.

#### 6.2 Government Portal Integrations (P1)
- **E-Invoicing API**: Real-time B2B invoice generation of Invoice Reference Number (IRN) and signed QR code via NIC/GSP sandbox.
- **E-Way Bill Generation**: Generate 1-click E-Way bills for consignments exceeding statutory thresholds ($\ge ₹50,000$) with Transporter ID and Vehicle Number capture.

#### 6.3 Tally Integration Bridge (Optech Benchmark Feature)
- **Tally XML Direct Export**:
  - Export Sales Vouchers, Purchase Vouchers, Receipt Vouchers, Payment Vouchers, and Journal Entries formatted for Tally Prime / Tally.ERP 9.
- **Tally Master Sync**: Sync Ledger Masters (Sundry Debtors, Sundry Creditors, Sales Accounts, Purchase Accounts, Tax Ledgers) directly into StoreAI.

---

### Module 7: Unified Omnichannel & E-Commerce Storefront
*Priority: P1 (Growth Engine)*

- **Single Shared Inventory Pool**: When an item sells on the physical POS counter, online web inventory decrements instantly via WebSocket broadcast.
- **Instant Tenant Web Store (`storename.storeai.in` or Custom Domain)**:
  - Mobile-responsive storefront with category browsing, product search, cart, and checkout.
  - Payment Gateway integration (Razorpay, PhonePe, Cashfree, UPI QR).
  - Delivery modes: Store Pickup (BOPIS) or Local Home Delivery.
- **WhatsApp Commerce Integration**:
  - Send interactive product catalogs over WhatsApp Business API.
  - Customers can add to cart and place orders directly within WhatsApp.
  - Automated WhatsApp invoice dispatch with PDF download links.

---

### Module 8: Customer CRM, Credit Ledgers (Udhar) & Loyalty
*Priority: P1 (Customer Retention)*

- **Customer 360 Profile**: Mobile number, name, GSTIN, billing address, lifetime order value (LTV), average basket size, and last visit date.
- **Customer Credit Ledger (Khata / Udhar)**:
  - Set credit limit and max credit days per customer.
  - Automated WhatsApp reminder messages with payment UPI links for overdue balances.
  - Comprehensive Statement of Account generation (PDF / WhatsApp).
- **Configurable Loyalty Program**:
  - Points earning rule (e.g., 1 Point per ₹100 spent).
  - Points redemption rule (e.g., 1 Point = ₹1 discount on minimum bill of ₹500).
  - Tiered membership (Silver, Gold, Platinum) with tier-specific discounts.

---

### Module 9: AI Intelligence Engine & Autonomous Copilot (StoreAI Differentiator)
*Priority: P2 (Predictive Commerce)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                          STOREAI AI BRAIN                              │
├────────────────────────────────────────────────────────────────────────┤
│  1. DEMAND FORECASTING ENGINE                                         │
│     Predicts item sales velocity using 90-day moving average, day of   │
│     week seasonality, local holiday spikes, and vendor lead times.     │
│                                                                        │
│  2. AUTOMATED REORDER & REPLENISHMENT ADVISOR                          │
│     Formula:                                                           │
│     Reorder Qty = (Avg Daily Sales × Lead Time Days) + Safety Stock    │
│                   - (Current Stock + On-Order Stock)                   │
│                                                                        │
│  3. DEAD-STOCK & MARKDOWN OPTIMIZER                                    │
│     Detects SKUs with zero sales in 60+ days and suggests dynamic      │
│     bundle discounts with fast-moving complementary items.             │
│                                                                        │
│  4. CONVERSATIONAL COPILOT (Natural Language Query)                    │
│     "Show me top 5 grossing categories this week"                     │
│     "Which suppliers have delivery delays > 3 days?"                  │
│     "Generate draft PO for all items below safety stock"               │
└────────────────────────────────────────────────────────────────────────┘
```

#### Autonomous Action Execution (Human-in-the-Loop)
- The AI Copilot does not just produce dashboards; it generates executable drafts:
  - **Auto PO Creation**: Generates vendor-wise purchase orders with recommended quantities $\rightarrow$ Manager clicks `[Approve & Dispatch PO]`.
  - **Win-back Campaign**: Identifies customers who have not visited in 45 days $\rightarrow$ Drafts WhatsApp coupon `[Send ₹100 Welcome-Back Voucher]`.

---

### Module 10: Multi-Tenant RBAC, Security & Enterprise Auditing
*Priority: P0 (Platform Integrity)*

#### 10.1 Role-Based Access Control (RBAC) Matrix

| Module / Action | Cashier | Store Manager | Accountant | Inventory Manager | Org Admin / Owner |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Create POS Bill / Scan** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Apply Line Discount (>10%)** | ❌ (Approval req.) | ✅ | ❌ | ❌ | ✅ |
| **Cancel / Void Invoice** | ❌ (Approval req.) | ✅ | ❌ | ❌ | ✅ |
| **Open / Close Shift (Z-Report)** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Stock Adjustments / Write-offs**| ❌ | ❌ | ❌ | ✅ | ✅ |
| **View Profit Margins / Cost Price**| ❌ | ❌ | ✅ | ❌ | ✅ |
| **Access GST Returns & Daybook** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Approve Purchase Orders** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **User & Tenant Management** | ❌ | ❌ | ❌ | ❌ | ✅ |

#### 10.2 Security & Immutable Audit Logs
- Every price override, invoice cancellation, stock adjustment, and cash drawer opening logs an immutable audit entry with `UserID`, `TerminalID`, `Timestamp`, `OldValue`, `NewValue`, and `IPAddress`.

---

## 6. Hardware & Peripheral Integration Standards

To match Optech’s battle-tested operational capability, StoreAI specifies strict hardware protocol support:

```
┌───────────────────────────────────────────────────────────────────────┐
│                    STOREAI HARDWARE BUS LAYER                         │
├──────────────────┬──────────────────┬────────────────┬────────────────┤
│ THERMAL PRINTERS │ BARCODE SCANNERS │ WEIGHING SCALE │ CASH DRAWERS   │
│ ESC/POS 2" & 3"  │ USB HID Keyboard │ RS-232 / COM   │ RJ-11/12 via   │
│ USB / BT / LAN   │ 2D QR Bluetooth  │ Direct Scale   │ Thermal Port   │
│ Direct ESC/POS   │ Camera Barcode   │ Auto Weight    │ Auto Drawer    │
│ Raw Bytes        │ Scanner Stream   │ Reading Sync   │ Kick on Cash   │
└──────────────────┴──────────────────┴────────────────┴────────────────┘
```

1. **Receipt Printing**: Direct thermal printing via WebUSB / WebSerial API using raw ESC/POS byte streams (eliminating the slow browser print preview dialog).
2. **Barcode Scanners**: Full support for standard USB HID scanners acting as keyboard wedges, plus WebRTC-based camera barcode scanning for mobile devices.
3. **Electronic Weighing Scales**: Continuous weight reading via RS-232 COM port interface for bulk grocery and produce billing.
4. **Cash Drawers**: Automatic pulse trigger via RJ-11 printer kick connector upon cash settlement.

---

## 7. Non-Functional Requirements (NFRs) & Performance SLOs

| Dimension | Target Metric / Service Level Objective (SLO) | Operational Context |
| :--- | :--- | :--- |
| **Barcode Lookup Latency** | **$< 50 \text{ ms}$** | Instantaneous scan response during peak queue hours |
| **End-to-End Invoice Print** | **$< 1.5 \text{ seconds}$** | From clicking `Settle` to receipt cutting on thermal printer |
| **Offline Resilience** | **$100\%$ availability** | Zero counter downtime during internet disconnection |
| **Cloud Sync Latency** | **$< 3 \text{ seconds}$** | Delta sync to central server once connection restores |
| **Inventory Concurrency** | **Zero overselling** | Optimistic locking and atomic decrement across channels |
| **System Uptime** | **$99.95\%$ Uptime SLA** | High-availability cloud infrastructure with auto-failover |
| **Data Retention & Backups** | **RPO $< 1 \text{ min}$, RTO $< 15 \text{ min}$** | Continuous transactional replication and point-in-time recovery |

---

## 8. Phased Implementation Roadmap

```
2026 ROADMAP
Q1 (Weeks 1-10)          Q2 (Weeks 11-18)          Q3 (Weeks 19-26)          Q4 (Weeks 27-36)
┌──────────────────┐     ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ PHASE 1:         │     │ PHASE 2:         │      │ PHASE 3:         │      │ PHASE 4:         │
│ RETAIL CORE      │ ──► │ COMPLIANCE & WEB │ ──►  │ AI INTELLIGENCE  │ ──►  │ ENTERPRISE & ERP │
│ • High-Speed POS │     │ • GST Returns    │      │ • Auto Reorder   │      │ • Tally Bridge   │
│ • ESC/POS Print  │     │ • E-Invoice API  │      │ • Demand Forecast│      │ • e-Way Bill API │
│ • Multi-MRP/Batch│     │ • Web Storefront │      │ • Dead-Stock AI  │      │ • Supplier Portal│
│ • Cashier Shifts │     │ • WhatsApp Invc  │      │ • AI Copilot NLQ │      │ • Advanced RBAC  │
│ • Offline Sync   │     │ • Customer Khata │      │ • Campaign Bot   │      │ • Custom Integr  │
└──────────────────┘     └──────────────────┘      └──────────────────┘      └──────────────────┘
```

### Phase Breakdown

#### Phase 1: Retail Operational Core (Weeks 1–10) — Target: Optech Baseline Parity
- High-speed POS billing engine with complete keyboard navigation (`F1`–`F12`).
- ESC/POS thermal printing integration via WebUSB/WebSerial.
- Item Master with multi-MRP, batch management, and FEFO expiry rules.
- Cashier shift lifecycle (Float declaration, blind close, X/Z settlement reports).
- Offline-first IndexedDB local billing cache and delta-sync engine.
- Multi-warehouse stock transfers (STN $\rightarrow$ In-Transit $\rightarrow$ GRN).

#### Phase 2: Indian Compliance, CRM & Omnichannel Commerce (Weeks 11–18)
- Complete GSTR-1, GSTR-3B export generation.
- Customer Khata (Credit Ledger) with WhatsApp statement links.
- Single-pool native E-Commerce Storefront builder (`store.storeai.in`).
- WhatsApp invoice sharing and automated payment reminder bot.

#### Phase 3: AI Intelligence & Autonomous Action Engine (Weeks 19–26)
- AI Demand Forecasting Engine using sales velocity and seasonal indicators.
- 1-Click Automated Purchase Order replenishment generator.
- Dead-stock identification and bundle discount advisor.
- Natural language AI Copilot for operational and financial queries.

#### Phase 4: Enterprise Scale, Accounting & Marketplace Integrations (Weeks 27–36)
- Automated Tally Prime / ERP 9 XML and direct sync bridge.
- Direct NIC/GSP E-Invoice (IRN) and E-Way Bill cloud API integration.
- Supplier Self-Service Portal (PO acknowledgment, ASN, invoice upload).
- Enterprise Multi-Tenant Hierarchy (Headquarters $\rightarrow$ Regional Warehouse $\rightarrow$ Retail Outlets).

---

## 9. Pricing & Monetization Structure

| Plan Tier | Monthly Price | Target Customer | Included Features & Limits |
| :--- | :--- | :--- | :--- |
| **Starter (Single Store)** | **₹1,299 / mo** | Small Retailer, Grocery, Boutique (1 Store, 2 Counters) | High-speed POS, Offline Billing, Inventory, Thermal Printing, Basic GST Reports, WhatsApp Invoicing. |
| **Growth (Omnichannel)** | **₹3,499 / mo** | Growing Retailer (Up to 3 Stores, 1 Warehouse) | Everything in Starter + E-Commerce Web Storefront, Customer Khata CRM, Multi-Branch Transfers, Basic AI Reorder Alerts. |
| **Business Pro (Multi-Store)** | **₹8,999 / mo** | Retail Chain (Up to 10 Stores, 3 Warehouses) | Everything in Growth + Full AI Copilot & Demand Forecasting, Tally Integration, E-Invoice API, Advanced RBAC, Shift Auditing. |
| **Enterprise Chain** | **Custom / Quote** | Large Retail Chains (10+ Stores, Enterprise Distros) | Unlimited Outlets, Dedicated Cloud Tenant, Custom ERP/API Integrations, 24/7 SLA, On-site Training. |

---

## 10. Summary & Strategic Sign-Off

StoreAI V2.0 transforms traditional retail software into a **modern, unified commerce platform**. By combining the operational robustness of systems like Optech with cloud-native multi-tenancy, real-time omnichannel synchronization, and predictive AI, StoreAI delivers a solution designed to meet the demands of modern retail.

$$\mathbf{StoreAI = \text{System of Record (Optech-Grade Operational POS)} + \text{System of Intelligence (AI Forecasts)} + \text{System of Action (1-Click Automation)}}$$
