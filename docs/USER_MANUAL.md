# StoreAI Enterprise Platform - User Manual
**Version 1.0** | **Date:** 2026-01-27

---

## 📖 Introduction
Welcome to **StoreAI**, the comprehensive Enterprise Resource Planning (ERP) platform designed for modern retail and logistics businesses. This manual guides business owners, managers, and staff through the system's core functionalities, from inventory tracking to financial reporting.

---

## ⚡ Getting Started

### 1. Access & Login
*   **URL**: Navigate to your deployed application URL.
*   **Credentials**: Log in using your registered email and password.
*   **Tenant Selection**: If you belong to multiple organizations, the system will automatically route you to your primary storefront.

### 2. The Dashboard
Your central command center provides a real-time snapshot of your business:
*   **Key Metrics**: Total Users, Active Orders, Revenue, and Stock Alerts.
*   **Navigation Sidebar**: Access all core modules (Inventory, Sales, HR, etc.) from the left menu.
*   **Quick Actions**: Use the `NEW` button to rapidly create Sales, Orders, or Products.

---

## 📦 Module Guide

### 1. Inventory Management
*Manage your products, stock levels, and warehouses.*
*   **Product Catalogue**: View all items. Click `ADD PRODUCT` to define new SKUs with pricing, cost, and reorder levels.
*   **Warehouses**: Track stock across multiple locations (e.g., London Central Hub).
*   **Stock Summary**: Real-time view of quantity on hand. The system automatically calculates "Days Remaining" based on sales velocity.

### 2. Sourcing & Procurement
*Manage suppliers and purchase stock.*
*   **Supplier Directory**: Maintain a database of verified vendors.
*   **Purchase Orders (PO)**: 
    *   Create a PO to order stock. 
    *   **GST Impact**: The system automatically adds **18% Input GST** to the PO total.
    *   **Approvals**: Managers must `APPROVE` a PO to authorize the financial commitment.
*   **Goods Received (GRN)**: When stock arrives, process a GRN to update inventory levels automatically.

### 3. Sales & CRM
*Drive revenue and manage customer relationships.*
*   **Point of Sale (POS)**: 
    *   Select a customer and add items to the cart.
    *   **Taxation**: **18% Output GST** is automatically calculated and added to the invoice.
    *   **Stock Effect**: Completing a sale instantly deducts stock from inventory.
*   **Customer Database**: Track client details and purchase history.
*   **Deals Pipeline**: Manage B2B opportunities through stages (Lead -> Negotiation -> Closed).

### 4. Human Resources (HR)
*Manage your workforce and payroll.*
*   **Employee Roster**: Onboard new staff with roles, salaries, and department info.
*   **Attendance**: Mark daily attendance (Present/Absent).
*   **Payroll Processing**:
    *   Select an employee and click `PROCESS PAY`.
    *   **Projection Screen**: Enter Base Pay, Incentives, and Overtime Hours. The system displays a **Projected Payable** amount in real-time.
    *   **Disbursement**: Confirming pay logs the expense to the company ledger.
    *   **Total Spent**: View the "Total Disbursed (YTD)" card for a quick expense summary.

### 5. Financial Operations (Accounts)
*Track your money and tax obligations.*
*   **General Ledger**: A tamper-proof record of every financial transaction (Sales, Purchases, Payroll, Expenses).
*   **GST Reporting**:
    *   **Net GST Liability Card**: Instantly see your tax standing.
    *   *Calculation*: `(GST Collected on Sales) - (GST Paid on Purchases)`.
    *   **Red Status**: You owe tax to the government.
    *   **Green Status**: You have a tax credit carryover.
*   **Financial Summary**: View Total Receivables vs. Payables and Cash on Hand.

---

## 🛠 Common Workflows

### How to File GST Returns?
1.  Navigate to **Accounts**.
2.  Check the **Net GST Liability** card.
3.  The system has already aggregated all your Sales (Output Tax) and approved Purchases (Input Tax).
4.  Use the displayed "Net Payable" figure for your tax filing.

### How to Reorder Stock?
1.  Check **Inventory**. Items with low stock will be flagged.
2.  Go to **Purchases** -> `NEW ORDER`.
3.  Select a Supplier and the items to restock.
4.  Once approved by a manager, the PO is sent (simulated).
5.  When items arrive, verify the count and Create a **GRN** to update stock.

### How to Run Payroll?
1.  Go to **HR**.
2.  Ensure **Attendance** is marked for the period.
3.  Click `PROCESS PAY` for an employee.
4.  Input dynamic components (Sales Commission, Overtime).
5.  Verify the **Projected Payable** box.
6.  Click `EXECUTE PROTOCOL` to finalize.

---

## 🆘 Support
For technical issues or feature requests, please contact the StoreAI IT Admin Team at `admin@storeai.com`.
