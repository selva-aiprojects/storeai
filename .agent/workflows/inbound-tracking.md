---
description: how to track supplier shipments (Inbound Tracking Workflow)
---

This workflow ensures your inventory reorder levels are synced with products currently in transit from vendors.

### 1. Issue Purchase Order
- Navigate to **"Supply Chain"** and create a **New Entry**.
- Once committed, the order status is **PENDING**.

### 2. Supplier Shipment (Tracking Sync)
- When the vendor provides shipping details, locate the order in the **"Supply Chain Tracking"** table.
- Use the **"Update Tracking"** protocol to enter:
    - **Tracking Number** (e.g., FedEx-9000-X)
    - **Shipping Carrier** (FedEx, DHL, BlueDart)
    - **Expected Delivery Date**

### 3. Transit State
- Update the order status to **SHIPPED**.
- *Intelligence Sync*: Products in "SHIPPED" status are marked as **"Incoming Capital."** This helps the system ignore reorder warnings for these items as replenishments are already on the way.

### 4. Inward Logistics (Warehouse Arrival)
- Upon arrival, click **"COMPLETE INWARD"**.
- The system will:
    - Automatically sync physical counts to the **Catalog Matrix**.
    - Resolve the **PENDING** or **SHIPPED** status to **RECEIVED**.
    - Close the procurement loop.
