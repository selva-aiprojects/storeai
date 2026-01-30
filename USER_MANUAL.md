# StoreAI Intelligence Platform: Comprehensive User Manual

Welcome to the **StoreAI Intelligence Platform** from Cognivectra's product. This manual provides detailed, step-by-step instructions for every role within the ecosystem, ensuring maximum efficiency and data-driven decision-making.

---

## 1. Introduction
StoreAI Intelligence Platform is a next-generation ERP and Intelligence platform from Cognivectra's product line, designed to streamline retail, procurement, HR, and financial operations through AI-powered insights (RAG) and automated workflows.

---

## 2. Role-Based Perspectives

### 🛡️ Super Admin (System Governance)
*Focus: Global oversight, Tenant management, and High-level architecture.*

1. **Tenant Provisioning**:
    - Navigate to **"Settings"** in the sidebar.
    - Click **"Add Tenant"** to register a new business entity.
    - Configure tenant-specific branding and module access flags.
2. **Global Monitoring**:
    - Access the main **Dashboard** to view aggregate metrics across all active tenants.
3. **Security Protocols**:
    - Audit system logs and ensure global API keys (Gemini, ChromaDB) are active.

### 🏢 Tenant Admin (Store Management)
*Focus: Managing your specific store/business unit.*

1. **Onboarding Staff**:
    - Navigate to **"System Core"** -> **Identity Hub**.
    - Use the **"New User"** button to create credentials for your team.
    - Assign roles (ACCOUNTANT, HR_MANAGER, etc.).
2. **Feature Configuration**:
    - Enable or disable modules (Finance, AI, Procurement) via Tenant Settings.
3. **Data Integrity**:
    - Periodically verify that product lists and customer data are up to date.

### 💰 Accountant (Financial Control)
*Focus: Financial transparency and regulatory compliance.*

1. **Daily Operations**:
    - Open the **Daybook** to record and review all daily transactions.
2. **Ledger Management**:
    - Access the **General Ledger** for account-level granularity.
3. **Compliance & Reporting**:
    - Generate **GST Reports** and track **Liabilities** in real-time.
    - Review **Profit & Loss (P&L)** statements monthly for strategic adjustments.

### 👥 HR Manager (Workforce Execution)
*Focus: Personnel, Payroll, and Performance.*

1. **Staff Registration**:
    - Use the **"Workforce Portal"** to register new employees.
    - Link them to system user identities for portal access.
2. **Attendance Tracking**:
    - Monitor the **Attendance Master** for clock-ins and performance metrics.
3. **Payroll Processing**:
    - Execute the **Payroll Engine** to calculate and approve salaries.

### 📦 Supervisor (Inventory & Supply Chain)
*Focus: Stock health and procurement logistics.*

1. **Stock Monitoring**:
    - Check the **Catalog Matrix** for "REORDER" statuses.
2. **Procurement**:
    - Open the **Procurement Hub** to issue Purchase Orders to supply partners.
3. **Inward Logistics**:
    - Click **"INWARD"** on arriving shipments to instantly update stock levels.

### 🛒 POS Operator (Sales & Service)
*Focus: Transaction speed and customer satisfaction.*

1. **Store Sales**:
    - Use the **Sales [POS]** terminal for quick item scanning and checkout.
2. **Returns Processing**:
    - Navigate to **Sales Returns** to handle customer exchanges or refunds.
3. **Customer Loyalty**:
    - Access the **Customers** module to view history and preferences.

---

## 3. Core Module Guides

### 🔐 Identity Hub & Access Control
- **Step 1**: Go to **"System Core"**.
- **Step 2**: Click **"New User"** in the top header.
- **Step 3**: Assign a specific Role:
    - **ACCOUNTANT**: Financial Ledger and Accounts.
    - **HR MANAGER**: Workforce Portal and Attendance.
    - **SUPERVISOR**: Inventory and Staff.
    - **ADMIN**: Global access.
- **Step 4**: Click **Commit Protocol**.

### 🏗️ Inventory & Catalog Matrix
- **Adding Products**: Go to **Product Catalog** -> **New Entry**.
- **Monitoring Stock**: Identify items with **"REORDER"** status (Stock ≤ Reorder Point).
- **Manual Adjustments**: Use **Stock Master** to adjust counts manually or view history.

### 🚛 Supply Chain & Procurement (Inbound)
- **Initiating Orders**: **Procurement Hub** -> **New Entry** -> Select Partner -> Specify Quantities -> **Commit Protocol**.
- **Tracking Shipments**: Locate order in **Supply Chain Tracking** -> **Update Tracking** (Enter Tracking #, Carrier, Expected Date) -> Set status to **SHIPPED**.
- **Receiving Stock**: When physical stock arrives, click **"COMPLETE INWARD"**. The system will instantly increment inventory counts.

### 👥 Workforce & Payroll
- **Register Personnel**: Go to **Workforce Portal** -> **New Entry**. Link to a System User if they need portal access.
- **Attendance & Performance**:
    - **Daily Log**: Locate employee -> Click **"Presence"**.
    - **Rating**: Hover over Performance column -> Assign **Rating Protocol** (1-5 stars).
- **Processing Payroll**: Click the **Hand/Coins 💰 icon** on the employee row. This creates a Ledger Debit and marks the month as paid.

### 🏠 Home Delivery & Fulfillment (Outbound)
- **Customer Setup**: Navigate to **"Delivery Nodes"** -> **New Customer** (Save name/address).
- **Sales Protocol**:
    - Open **Sales Terminal** -> Select **Customer Identity**.
    - Check **"Home Delivery Protocol"**.
- **Fulfillment**: Locate sale in terminal table -> Click **"Log Shipment"** -> Enter Carrier/Tracking -> **Commit Protocol**. Status transitions to **SHIPPED**.

---

## 4. 🤖 AI Intelligence Engine
*Unified RAG-powered analytics for every department.*

### How to use the AI Assistant:
1. **Open the Agent**: Click **"AI Intelligence"** in the sidebar.
2. **Context-Aware Queries**: The AI knows your inventory, sales, and staff data.
3. **Example Success Prompts**:
    - **Supply Chain**: *"Give me a list of all items arriving next week."*
    - **Finance**: *"What was our total GST liability for the last quarter?"*
    - **HR**: *"Who is our highest-rated employee in the Retail department?"*
    - **General**: *"Summarize today's sales performance vs yesterday."*

---

## 5. System Health & Support
- **Protocol Failures**: If a "Commit Protocol" fails, check your network or user permissions.
- **Data Sync**: The system uses a real-time reactive architecture. If UI data feels stale, use the browser refresh.
- **Architecture Advisory**: For technical deep-dives, see the `ARCHITECTURE_ADVISORY.md` file in the root directory.

---
*Manual Generated by StoreAI Intelligence Platform Architect - 2026*
