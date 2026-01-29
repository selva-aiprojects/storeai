# StoreAI ERP: Sample Data & Reporting Queries

This document provides sample SQL `INSERT` statements for the refined schema and example `SELECT` queries utilizing the newly created reporting views.

## Sample Data (INSERT)

### 1. Categories & Products
```sql
-- Create a high-tech category
INSERT INTO "Category" (id, name, description, "tenantId")
VALUES (uuid_generate_v4(), 'Cloud Infrastructure', 'Server and networking gear', 'YOUR_TENANT_ID');

-- Create a product
INSERT INTO "Product" (id, sku, name, description, price, "costPrice", "stockQuantity", "categoryId", "tenantId", "isBatchTracked", "gstRate")
VALUES (uuid_generate_v4(), 'K8S-NODE-01', 'Cloud Node P8', 'High performance compute node', 1200, 800, 10, 'CATEGORY_ID', 'TENANT_ID', true, 18);
```

### 2. Supplier & Purchase Order
```sql
-- Create a supplier
INSERT INTO "Supplier" (id, name, email, status, "tenantId")
VALUES (uuid_generate_v4(), 'Global Tech Corp', 'sales@globaltech.com', 'ACTIVE', 'TENANT_ID');

-- Create a Purchase Order
INSERT INTO "Order" (id, "orderNumber", status, "totalAmount", "supplierId", "tenantId")
VALUES (uuid_generate_v4(), 'PO-2026-0001', 'APPROVED', 8000, 'SUPPLIER_ID', 'TENANT_ID');
```

## Example Reporting Queries

### 1. Check Real-time Batch Stock
Use the `vw_current_stock` view to see exactly what's available and where.
```sql
SELECT * FROM vw_current_stock 
WHERE "tenantId" = 'YOUR_TENANT_ID' 
ORDER BY product_name;
```

### 2. Daily Sales Performance
Get a breakdown of revenue and taxes from `vw_sales_summary`.
```sql
SELECT 
    sale_date::date, 
    SUM("totalAmount") as daily_revenue, 
    SUM("taxAmount") as daily_tax 
FROM vw_sales_summary 
WHERE "tenantId" = 'YOUR_TENANT_ID'
GROUP BY sale_date::date;
```

### 3. Identify Low Stock Items
Automatically find products that need reordering using `vw_reorder_alerts`.
```sql
SELECT name, sku, "stockQuantity", shortage 
FROM vw_reorder_alerts 
WHERE "tenantId" = 'YOUR_TENANT_ID';
```

### 4. Monthly Payroll Overview
Review net payouts for the current month.
```sql
SELECT employee_name, "netSalary", status 
FROM vw_payroll_summary 
WHERE period = '2026-01' AND "tenantId" = 'YOUR_TENANT_ID';
```
