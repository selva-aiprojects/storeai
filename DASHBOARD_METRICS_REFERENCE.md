# Dashboard Metrics Reference Guide

This document provides a complete mapping of all dashboard metrics to their backend API endpoints and database queries.

## 🔗 Base URL
- **Local Development**: `http://localhost:5000/api/v1`
- **Production**: Your deployed backend URL + `/api/v1`

---

## 📊 Main Dashboard Metrics

### 1. **Financial Status Section**

#### Total Revenue
- **Metric**: Sum of all sales amounts
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `revenue`
- **Database Query**:
  ```sql
  SELECT SUM("totalAmount") FROM "Sale" WHERE "tenantId" = ? AND "isDeleted" = false
  ```
- **Direct Check**: `GET /api/v1/sales` (get all sales and sum totalAmount)

#### Procurement Cost
- **Metric**: Sum of all purchase order amounts
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `procurement`
- **Database Query**:
  ```sql
  SELECT SUM("totalAmount") FROM "Order" WHERE "tenantId" = ? AND "isDeleted" = false
  ```
- **Direct Check**: `GET /api/v1/orders` (get all orders and sum totalAmount)

#### Net Operational Balance
- **Metric**: Revenue - Procurement
- **Calculation**: Client-side (totalRevenue - totalProcurement)
- **Verify Components**: Check both revenue and procurement endpoints above

#### Workflow Velocity
- **Metric**: Count of active pipeline items
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `activity` object
- **Database Query**:
  ```sql
  SELECT "status", COUNT(*) FROM "Sale" 
  WHERE "tenantId" = ? AND "isDeleted" = false 
  GROUP BY "status"
  ```

---

### 2. **Workflow Pipeline Cards**

#### To Be Packed
- **Metric**: Sales with status 'PENDING' and isHomeDelivery = true
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `activity.toBePacked`
- **Direct Check**: `GET /api/v1/sales` (filter by status='PENDING' and isHomeDelivery=true)

#### To Be Shipped
- **Metric**: Sales with status 'PACKED'
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `activity.toBeShipped`
- **Direct Check**: `GET /api/v1/sales` (filter by status='PACKED')

#### To Be Delivered
- **Metric**: Sales with status 'SHIPPED'
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `activity.toBeDelivered`
- **Direct Check**: `GET /api/v1/sales` (filter by status='SHIPPED')

#### To Be Invoiced
- **Metric**: Sales with paymentStatus 'PENDING'
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `activity.toBeInvoiced`
- **Direct Check**: `GET /api/v1/sales` (filter by paymentStatus='PENDING')

---

### 3. **Product Portfolio Section**

#### Low Stock Items
- **Metric**: Products where stockQuantity <= lowStockThreshold
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `lowStock`
- **Database Query**:
  ```sql
  SELECT COUNT(*) FROM "Product" 
  WHERE "tenantId" = ? 
  AND "isDeleted" = false 
  AND "stockQuantity" <= "lowStockThreshold"
  ```
- **Direct Check**: `GET /api/v1/products` (filter where stockQuantity <= reorderPoint)

#### All Item Groups
- **Metric**: Count of unique categories
- **Direct Check**: `GET /api/v1/categories`
- **Count**: Number of categories returned

#### All Items
- **Metric**: Total product count
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `totalProducts`
- **Direct Check**: `GET /api/v1/products`

#### Active Items
- **Metric**: Products where isDeleted = false
- **Direct Check**: `GET /api/v1/products` (filter by isDeleted=false)

---

### 4. **Inventory Momentum Section**

#### Quantity in Hand
- **Metric**: Sum of all product stock quantities
- **Direct Check**: `GET /api/v1/products`
- **Calculation**: Sum all `stockQuantity` fields
- **Database Query**:
  ```sql
  SELECT SUM("stockQuantity") FROM "Product" 
  WHERE "tenantId" = ? AND "isDeleted" = false
  ```

#### To Be Received
- **Metric**: Sum of pending order items
- **API Endpoint**: `GET /api/v1/dashboard/stats`
- **Response Field**: `activeOrders`
- **Direct Check**: `GET /api/v1/orders` (filter by status != 'RECEIVED')
- **Database Query**:
  ```sql
  SELECT COUNT(*) FROM "Order" 
  WHERE "tenantId" = ? 
  AND "status" = 'PENDING' 
  AND "isDeleted" = false
  ```

---

### 5. **Top Performing Products**

#### Top Selling Items
- **Metric**: Products sorted by total quantity sold
- **Direct Check**: `GET /api/v1/sales` (include items)
- **Calculation**: 
  1. Get all sales with items
  2. Group by product name
  3. Sum quantities
  4. Sort descending
  5. Take top 5

**Manual Verification Query**:
```sql
SELECT p.name, SUM(si.quantity) as total_sold
FROM "SaleItem" si
JOIN "Product" p ON si."productId" = p.id
JOIN "Sale" s ON si."saleId" = s.id
WHERE s."tenantId" = ? AND s."isDeleted" = false
GROUP BY p.name
ORDER BY total_sold DESC
LIMIT 5
```

---

### 6. **Market Intelligence (AI-Powered)**

#### Quantum Market Sentiment
- **API Endpoint**: `GET /api/v1/ai/market-research` (or similar AI endpoint)
- **Response Fields**:
  - `market_sentiment`: BULLISH/BEARISH
  - `summary`: Text analysis
  - `top_picks`: Array of product recommendations
  - `exchanges`: Live exchange data
  - `volatility`: Market volatility indicator

**Note**: This data comes from the AI service, not the database.

---

### 7. **Direct Release Advisor (FIFO)**

#### Batch Information
- **Metric**: Products with batch tracking
- **Direct Check**: `GET /api/v1/products` (include batches)
- **Database Query**:
  ```sql
  SELECT 
    p.name,
    pb."batchNumber",
    pb."quantityAvailable",
    pb."expiryDate",
    p.unit
  FROM "ProductBatch" pb
  JOIN "Product" p ON pb."productId" = p.id
  WHERE p."tenantId" = ?
  AND pb.status = 'ACTIVE'
  ORDER BY pb."expiryDate" ASC
  ```

---

## 🔍 Complete API Endpoint Reference

### Core Endpoints

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/dashboard/stats` | GET | All dashboard statistics | Complete stats object |
| `/products` | GET | All products | Array of products with stock info |
| `/sales` | GET | All sales | Array of sales with items |
| `/orders` | GET | All purchase orders | Array of orders |
| `/categories` | GET | All categories | Array of categories |
| `/customers` | GET | All customers | Array of customers |
| `/suppliers` | GET | All suppliers | Array of suppliers |
| `/employees` | GET | All employees | Array of employees |
| `/inventory/warehouses` | GET | All warehouses | Array of warehouses |

### Finance Endpoints

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/accounts/ledger` | GET | General ledger entries | Array of ledger entries |
| `/accounts/summary` | GET | Financial summary | Summary object |
| `/accounts/tax-summary` | GET | GST/Tax summary | Tax summary object |
| `/finance/daybook` | GET | Daybook entries | Array of daybook entries |
| `/finance/balance-sheet` | GET | Balance sheet | Balance sheet data |
| `/finance/profit-loss` | GET | P&L statement | P&L data |

### HR Endpoints

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/hr/employees` | GET | All employees | Array of employees |
| `/hr/payroll` | GET | Payroll records | Array of payroll entries |
| `/hr/attendance` | GET | Attendance records | Array of attendance |
| `/hr/departments` | GET | All departments | Array of departments |

### Reports Endpoints

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/reports/comprehensive` | GET | Comprehensive report | Full report object |
| `/reports/inventory` | GET | Inventory report | Inventory analysis |
| `/reports/sales` | GET | Sales report | Sales analysis |

---

## 🧪 Testing Dashboard Metrics

### Using cURL

```bash
# Get dashboard stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/dashboard/stats

# Get all products
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/products

# Get all sales
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/sales

# Get all orders
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/orders
```

### Using Browser Console

```javascript
// Get your token
const token = localStorage.getItem('store_ai_token');

// Fetch dashboard stats
fetch('http://localhost:5000/api/v1/dashboard/stats', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Dashboard Stats:', data));

// Fetch products
fetch('http://localhost:5000/api/v1/products', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Products:', data));

// Fetch sales
fetch('http://localhost:5000/api/v1/sales', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Sales:', data));
```

---

## 🗄️ Direct Database Queries

### Check Revenue
```sql
SELECT 
  SUM("totalAmount") as total_revenue,
  COUNT(*) as sale_count
FROM "Sale" 
WHERE "tenantId" = 'YOUR_TENANT_ID' 
AND "isDeleted" = false;
```

### Check Procurement
```sql
SELECT 
  SUM("totalAmount") as total_procurement,
  COUNT(*) as order_count
FROM "Order" 
WHERE "tenantId" = 'YOUR_TENANT_ID' 
AND "isDeleted" = false;
```

### Check Inventory
```sql
SELECT 
  SUM("stockQuantity") as total_stock,
  COUNT(*) as product_count,
  COUNT(CASE WHEN "stockQuantity" <= "lowStockThreshold" THEN 1 END) as low_stock_count
FROM "Product" 
WHERE "tenantId" = 'YOUR_TENANT_ID' 
AND "isDeleted" = false;
```

### Check Sales Pipeline
```sql
SELECT 
  status,
  COUNT(*) as count
FROM "Sale" 
WHERE "tenantId" = 'YOUR_TENANT_ID' 
AND "isDeleted" = false
GROUP BY status;
```

### Top Selling Products
```sql
SELECT 
  p.name,
  p.sku,
  SUM(si.quantity) as total_sold,
  COUNT(DISTINCT s.id) as sale_count
FROM "SaleItem" si
JOIN "Product" p ON si."productId" = p.id
JOIN "Sale" s ON si."saleId" = s.id
WHERE s."tenantId" = 'YOUR_TENANT_ID' 
AND s."isDeleted" = false
GROUP BY p.id, p.name, p.sku
ORDER BY total_sold DESC
LIMIT 10;
```

---

## 📝 Notes

1. **Authentication Required**: All endpoints require a valid JWT token in the Authorization header
2. **Tenant Isolation**: All data is automatically filtered by the tenant ID from your JWT token
3. **Soft Deletes**: Most queries filter out soft-deleted records (isDeleted = false)
4. **Real-time Updates**: Dashboard data refreshes when you perform actions or manually refresh
5. **Market Intelligence**: AI-powered features may have separate endpoints or be disabled if AI service is unavailable

---

## 🔧 Troubleshooting

### If metrics show 0 or empty:

1. **Check if you have data**:
   ```bash
   # Run the check_users.py script to verify tenant
   python check_users.py
   ```

2. **Verify your tenant has products**:
   ```sql
   SELECT COUNT(*) FROM "Product" WHERE "tenantId" = 'YOUR_TENANT_ID';
   ```

3. **Verify your tenant has sales**:
   ```sql
   SELECT COUNT(*) FROM "Sale" WHERE "tenantId" = 'YOUR_TENANT_ID';
   ```

4. **Check the browser console** for API errors
5. **Check the server logs** for backend errors

---

## 📅 Last Updated
February 7, 2026
