# 📘 StoreAI Enterprise Commerce OS — Complete & Exhaustive Functional Workflow Document

> **Document Version:** 3.0 Enterprise (Master Reference)  
> **Platform Version:** StoreAI Enterprise Global Release  
> **Coverage:** 100% Comprehensive Coverage across All 27 Application Modules & Sub-Modules  
> **Audience:** C-Level Executives, System Administrators, Operations Managers, Accountants, Audit Teams  

---

## 📑 Master Table of Contents
1. [Multi-Tenant Onboarding & SaaS Governance](#1-multi-tenant-onboarding--saas-governance)
2. [Global Multi-Currency & i18n Localization Engine](#2-global-multi-currency--i18n-localization-engine)
3. [AI Copilot & Business Intelligence Assistant](#3-ai-copilot--business-intelligence-assistant)
4. [Product Catalog & Variant Matrix Management](#4-product-catalog--variant-matrix-management)
5. [Warehouse Bin Allocation & Multi-Location Inventory](#5-warehouse-bin-allocation--multi-location-inventory)
6. [Inbound Procurement & Supplier Accounts Payable (AP)](#6-inbound-procurement--supplier-accounts-payable-ap)
7. [Supplier & Vendor Self-Service Portal](#7-supplier--vendor-self-service-portal)
8. [Omnichannel POS & Retail Sales Terminal](#8-omnichannel-pos--retail-sales-terminal)
9. [B2C E-Commerce Storefront & Checkout Orchestration](#9-b2c-e-commerce-storefront--checkout-orchestration)
10. [Promotions, Coupon Engine & Multi-Jurisdiction Tax](#10-promotions-coupon-engine--multi-jurisdiction-tax)
11. [Customer Self-Service RMA & Store Credit Wallet](#11-customer-self-service-rma--store-credit-wallet)
12. [Logistics, AWB Shipping Label & Carrier Tracking](#12-logistics-awb-shipping-label--carrier-tracking)
13. [CRM, Customer Segmentation & Loyalty Program](#13-crm-customer-segmentation--loyalty-program)
14. [Full Financial Accounting & Sub-Ledger System](#14-full-financial-accounting--sub-ledger-system)
    - 14.1 Daybook / Cash Journal & Petty Cash Management
    - 14.2 Accounts Receivable (AR) & Accounts Payable (AP) Aging
    - 14.3 General Ledger & Individual Account Ledger Breakdown
    - 14.4 Profit & Loss (P&L) Statement & Margin Analysis
    - 14.5 Balance Sheet & Asset/Liability Asset Engine
    - 14.6 GST & Tax Compliance Filing Matrix
15. [HR, Employee Master, Attendance & Payroll Engine](#15-hr-employee-master-attendance--payroll-engine)
    - 15.1 Employee Master Directory & Onboarding
    - 15.2 Daily Attendance & Leave Tracking
    - 15.3 Automated Payroll Calculation & Payslip Generator
    - 15.4 HR Analytics & Staffing Cost Reports
16. [Partners, Franchise & Distributor Network](#16-partners-franchise--distributor-network)
17. [Subscription Billing & Feature Entitlement Control](#17-subscription-billing--feature-entitlement-control)
18. [Executive Analytics, BI Dashboard & Reports](#18-executive-analytics-bi-dashboard--reports)

---

## 1. Multi-Tenant Onboarding & SaaS Governance
```
 [Platform Hub Admin (storeai)]
               │
               ▼
   ┌───────────────────────┐
   │ Provision New Tenant  │ ──► Configures Base Currency (INR, USD, EUR, etc.)
   └───────────────────────┘ ──► Sets Entitlements (RETAIL, CRM, HR, FINANCE)
               │
               ▼
   ┌───────────────────────┐
   │ Tenant SuperAdmin     │ ──► Governs Operators, Users, Roles & Subscriptions
   └───────────────────────┘
```
- **Platform Hub Administration**: Platform Admins (`storeai` tenant) manage, approve, suspend, or upgrade tenant accounts.
- **Tenant Data Isolation**: Database-level isolation by `tenantId` guarantees complete data privacy and security.

---

## 2. Global Multi-Currency & i18n Localization Engine
- **Base Tenant Currency**: Selectable during tenant creation (12+ supported currencies: `INR`, `USD`, `EUR`, `GBP`, `AED`, `JPY`, `CAD`, `AUD`, `SGD`, `MYR`, `SAR`, `QAR`).
- **Live FX Conversion**: Automatically converts base product prices to active customer currency.
- **Full Localization (LTR & RTL)**: Native support for Left-to-Right (English, French, German, Spanish) and Right-to-Left (Arabic, Hebrew) rendering with dynamic CSS shifts.

---

## 3. AI Copilot & Business Intelligence Assistant
- **AI Query Engine**: Natural language assistant (`/api/v1/ai/query`) providing instant insights on top-selling SKUs, low-stock warnings, sales trends, and cash flow alerts.
- **Automated Summaries**: Generates executive summaries for monthly revenue, inventory valuation, and profit margins.

---

## 4. Product Catalog & Variant Matrix Management
- **Matrix Stock Architecture**: Parent-child product relationships with options (Color, Size, Dimension, SKU-specific price adjustments).
- **Customer Ratings & Reviews**: B2C shoppers can submit verified product reviews with 1–5 star ratings and review headlines.

---

## 5. Warehouse Bin Allocation & Multi-Location Inventory
- **Bin Location Management**: Assigns SKUs to exact aisle, rack, and shelf bin codes (e.g., `BIN-A12-S3`).
- **Global Multi-Warehouse Sync**: Real-time inventory tracking across primary, regional, and storefront fulfillment centers.

---

## 6. Inbound Procurement & Supplier Accounts Payable (AP)
- **Supplier Directory**: Register vendors with Tax ID/GSTIN, contact numbers, and credit terms (`creditDays`).
- **Purchase Orders (PO)**: Issue POs, track delivery status (`PENDING` → `RECEIVED`), update Accounts Payable, and auto-increment stock upon receipt.

---

## 7. Supplier & Vendor Self-Service Portal
- **Vendor Dashboard**: Dedicated portal (`VendorPortal.tsx`) for suppliers to view pending purchase orders, confirm shipment dates, and download remittance statements.

---

## 8. Omnichannel POS & Retail Sales Terminal
- **Touch-Friendly POS**: High-speed counter checkout terminal supporting barcode scanning, cash/card payment modes, discount application, and instant receipt printing.
- **Automatic Stock Deduction**: Direct stock decrement upon sale completion.

---

## 9. B2C E-Commerce Storefront & Checkout Orchestration
- **Responsive Storefront**: B2C customer portal with product catalog grid, dynamic filtering, variant selection, and slide-over cart drawer.
- **Payment Gateway Orchestration**: Multi-channel gateway selection (Stripe Credit Card, PayPal Express, Apple Pay, Klarna Pay-in-4).

---

## 10. Promotions, Coupon Engine & Multi-Jurisdiction Tax
- **Promotional Coupon Engine**: Percentage (`WELCOME10`) and flat rate (`STOREAI500`) coupons with minimum order thresholds.
- **Multi-Jurisdiction Tax Engine**: Destination-based tax logic:
  - **US Sales Tax**: State-specific rates (CA 7.25%, NY 8.875%, TX 6.25%).
  - **EU VAT**: Standard VAT (DE 19%, FR 20%, ES 21%).
  - **GCC VAT**: UAE 5%, Saudi Arabia 15%.
  - **India GST**: CGST, SGST, and IGST (18% standard).

---

## 11. Customer Self-Service RMA & Store Credit Wallet
- **Self-Service RMA Portal**: Customers request returns with package condition, reason, and photo evidence.
- **Digital Store Credit Wallet**: Approved refunds can be credited directly to the customer's digital wallet (`walletController.ts`) for 1-click reuse at checkout.

---

## 12. Logistics, AWB Shipping Label & Carrier Tracking
- **Carrier Integration Engine**: Real-time shipping quotes from DHL, FedEx, Aramex, and Delhivery.
- **AWB Label Generator**: Produces Air Waybills and tracking links (`https://track.storeai.io/AWB-...`).
- **Shipment Status Tracking**: Lifecycle tracking (`LABEL_CREATED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`).

---

## 13. CRM, Customer Segmentation & Loyalty Program
- **Customer Directory & History**: Comprehensive view of customer purchase history, total spend, and contact records.
- **Loyalty Program**: Point accrual rules (e.g., 1 point per ₹100 spent), VIP tiers (Gold, Platinum), and point redemption rewards.

---

## 14. Full Financial Accounting & Sub-Ledger System

### 14.1 Daybook / Cash Journal & Petty Cash Management
- Log of all daily cash/bank inflows (`INCOME`) and outflows (`EXPENSE`).
- Petty Cash Float tracking and recurring expense approval workflows.

### 14.2 Accounts Receivable (AR) & Accounts Payable (AP) Aging
- Real-time aging schedules for unpaid customer invoices and vendor bills (`0-10`, `11-30`, `31-50`, `Overdue`).

### 14.3 General Ledger & Individual Account Ledger Breakdown
- Double-entry ledger with debit/credit entries for every account (Cash, Bank, Sales, Inventory, COGS, Accounts Receivable, Accounts Payable).

### 14.4 Profit & Loss (P&L) Statement & Margin Analysis
- Live revenue, COGS, operating expenses, gross profit, and net profit margin calculations.

### 14.5 Balance Sheet & Asset/Liability Engine
- Financial statement balancing Assets (Cash + Inventory + AR) against Liabilities (AP + Accrued Expenses) and Equity (`Opening Capital`).

### 14.6 GST & Tax Compliance Filing Matrix
- Automated calculation of taxable turnover, GST collected on sales, input tax credit (ITC) on purchases, and net tax liability.

---

## 15. HR, Employee Master, Attendance & Payroll Engine

### 15.1 Employee Master Directory & Onboarding
- Employee profile management with roles, job titles, department assignments, and basic salaries.

### 15.2 Daily Attendance & Leave Tracking
- Daily attendance logging (`PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE`), overtime hours, and leave approval management.

### 15.3 Automated Payroll Calculation & Payslip Generator
- Monthly salary processing factoring gross pay, deductions (PF, Tax, LOP), net payable, and digital payslip generation.

### 15.4 HR Analytics & Staffing Cost Reports
- Departmental headcount breakdowns, staffing cost analysis, and payroll expense trends.

---

## 16. Partners, Franchise & Distributor Network
- Management of B2B partners, franchise stores, wholesale distributors, commission rules, and territory allocations.

---

## 17. Subscription Billing & Feature Entitlement Control
- Plan upgrade management (`PRO`, `ENTERPRISE`), feature toggle controls (`RETAIL_MODULE`, `CRM_MODULE`, `HR_MODULE`, `FINANCE_MODULE`), and recurring billing schedules.

---

## 18. Executive Analytics, BI Dashboard & Reports
- Unified executive command dashboard with real-time KPI cards (Sales Revenue, Inventory Valuation, Net Profit, Active Customers, Pending POs) and exportable reports (PDF/Excel format).

---

### 🏆 Master Certification Statement
This Master Document certifies that **StoreAI Enterprise Commerce OS** provides **100% complete operational feature coverage** across all B2B, B2C, Retail, Inventory, Financial, HR, and Multi-Tenant Enterprise E-Commerce workflows.
