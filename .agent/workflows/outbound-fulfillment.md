---
description: how to fulfill and track customer orders (Outbound Fulfiment Workflow)
---

This workflow manages the lifecycle of a sale from invoice generation to final customer delivery.

### 1. Sales Generation
- Process a transaction via the **"Sales Terminal"**.
- This creates an invoice and transitions the sale status to **PENDING**.

### 2. Packaging & Shipment
- Navigate to the **"Sales Terminal"** table.
- Identify orders in **PENDING** status.
- Click **"Log Shipment"** for the target order.
- Enter the shipping details:
    - **Shipping Carrier** (UPS, FedEx, etc.)
    - **Tracking Number** (Provide the customer with this hash for their records).

### 3. Dispatch Protocol
- Click **"Commit Protocol"**.
- The sale status updates to **SHIPPED**.
- This clears the items from the "To-be-Processed" queue.

### 4. Delivery Confirmation
- Once the carrier confirms delivery, the system will resolve the transaction state.
- *Intelligence Sync*: This completes the revenue cycle and updates the **Capital Ledger** with final liquidation stats.
