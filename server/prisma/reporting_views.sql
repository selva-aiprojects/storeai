-- SQL Views for StoreAI ERP Reporting

-- 1. Current Stock (Batch-wise)
DROP VIEW IF EXISTS vw_current_stock;
CREATE VIEW vw_current_stock AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    w.name as warehouse_name,
    pb."batchNumber",
    pb."quantityAvailable",
    pb."costPrice",
    pb."expiryDate",
    p."tenantId"
FROM "Product" p
JOIN "ProductBatch" pb ON p.id = pb."productId"
JOIN "Stock" s ON p.id = s."productId" AND pb."batchNumber" = s."batchNumber"
JOIN "Warehouse" w ON s."warehouseId" = w.id
WHERE pb.status = 'ACTIVE';

-- 2. Sales Summary
DROP VIEW IF EXISTS vw_sales_summary;
CREATE VIEW vw_sales_summary AS
SELECT 
    s.id as sale_id,
    s."invoiceNo",
    s."totalAmount",
    s."taxAmount",
    s."cgstAmount",
    s."sgstAmount",
    s."igstAmount",
    s."createdAt" as sale_date,
    c.name as customer_name,
    s."tenantId"
FROM "Sale" s
LEFT JOIN "Customer" c ON s."customerId" = c.id
WHERE s."isDeleted" = false;

-- 3. Payroll Summary
DROP VIEW IF EXISTS vw_payroll_summary;
CREATE VIEW vw_payroll_summary AS
SELECT 
    p.id as payroll_id,
    e."firstName" || ' ' || e."lastName" as employee_name,
    p.month as period,
    p."grossSalary",
    p.deductions,
    p."netSalary",
    p."status",
    p."paymentDate",
    d."tenantId"
FROM "Payroll" p
JOIN "Employee" e ON p."employeeId" = e.id
JOIN "Department" d ON e."departmentId" = d.id;

-- 4. Reorder Alerts
DROP VIEW IF EXISTS vw_reorder_alerts;
CREATE VIEW vw_reorder_alerts AS
SELECT 
    p.id as product_id,
    p.name,
    p.sku,
    p."stockQuantity",
    p."lowStockThreshold",
    p."reorderPoint",
    (p."lowStockThreshold" - p."stockQuantity") as shortage,
    p."tenantId"
FROM "Product" p
WHERE p."stockQuantity" <= p."lowStockThreshold" AND p."isDeleted" = false;

-- 5. Batch Expiry & Risk Analysis
DROP VIEW IF EXISTS vw_batch_expiry;
CREATE VIEW vw_batch_expiry AS
SELECT 
    pb.id as batch_id,
    p.name as product_name,
    pb."batchNumber",
    pb."quantityAvailable",
    pb."expiryDate",
    p.unit,
    p."tenantId",
    CASE 
        WHEN pb."expiryDate" < CURRENT_DATE THEN 'EXPIRED'
        WHEN pb."expiryDate" < CURRENT_DATE + INTERVAL '30 days' THEN 'RISK (30D)'
        ELSE 'SAFE'
    END AS risk_status
FROM "ProductBatch" pb
JOIN "Product" p ON pb."productId" = p.id
WHERE pb."quantityAvailable" > 0;
