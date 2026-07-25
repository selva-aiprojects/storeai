-- Database Schema for Inventory Management System (PostgreSQL)

-- ENUMS
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED', 'RETURNED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'CREDIT');
CREATE TYPE "ReturnCondition" AS ENUM ('EXCELLENT', 'GOOD', 'DAMAGED', 'DEFECTIVE');
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED');

-- 1. Users & Auth
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" DEFAULT 'STAFF',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- 2. HR Management
CREATE TABLE "Department" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Employee" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID UNIQUE REFERENCES "User"("id") ON DELETE SET NULL,
    "employeeId" TEXT UNIQUE NOT NULL,
    "designation" TEXT NOT NULL,
    "joiningDate" TIMESTAMP NOT NULL,
    "salary" DECIMAL(10,2) NOT NULL,
    "departmentId" UUID NOT NULL REFERENCES "Department"("id"),
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- 3. Product Management
CREATE TABLE "Category" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Product" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sku" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2) NOT NULL,
    "stockQuantity" INTEGER DEFAULT 0,
    "lowStockThreshold" INTEGER DEFAULT 10,
    "unit" TEXT DEFAULT 'pcs',
    "categoryId" UUID NOT NULL REFERENCES "Category"("id"),
    "gstPercentage" DECIMAL(5,2) DEFAULT 18.00,
    "isReturnable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

-- 4. Order Management (Purchases)
CREATE TABLE "Supplier" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Order" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderNumber" TEXT UNIQUE NOT NULL,
    "status" "OrderStatus" DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "supplierId" UUID NOT NULL REFERENCES "Supplier"("id"),
    "gstAmount" DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "OrderItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "orderId" UUID NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "Product"("id")
);

-- 5. Sales Management
CREATE TABLE "Customer" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Sale" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "invoiceNo" TEXT UNIQUE NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "gstAmount" DECIMAL(10,2) DEFAULT 0,
    "customerId" UUID REFERENCES "Customer"("id"),
    "dueDate" TIMESTAMP, -- For Liability Aging (max 50 days)
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "SaleItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "saleId" UUID NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "Product"("id")
);

-- 6. Account Management
CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" DEFAULT 'CASH',
    "transactionId" TEXT UNIQUE,
    "saleId" UUID UNIQUE REFERENCES "Sale"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Ledger" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'DEBIT' or 'CREDIT'
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- 7. Advanced Finance (New Features)
CREATE TABLE "SalesReturn" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "saleId" UUID NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
    "returnDate" TIMESTAMP DEFAULT now(),
    "totalRefund" DECIMAL(10,2) NOT NULL,
    "transportDeduction" DECIMAL(10,2) DEFAULT 0,
    "packagingDeduction" DECIMAL(10,2) DEFAULT 0,
    "gstDeduction" DECIMAL(10,2) DEFAULT 0,
    "condition" "ReturnCondition" DEFAULT 'EXCELLENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "SalesReturnItem" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "salesReturnId" UUID NOT NULL REFERENCES "SalesReturn"("id") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "Product"("id"),
    "quantity" INTEGER NOT NULL,
    "refundAmount" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "Daybook" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" TIMESTAMP DEFAULT now(),
    "type" TEXT NOT NULL, -- 'SALE', 'PURCHASE', 'EXPENSE', 'RETURN'
    "description" TEXT,
    "debit" DECIMAL(10,2) DEFAULT 0,
    "credit" DECIMAL(10,2) DEFAULT 0,
    "referenceId" UUID,
    "status" "TransactionStatus" DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "RecurringExpense" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL, -- e.g., 'Rent', 'Staff Salary'
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "GSTLog" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL, -- 'INPUT' (Purchases) or 'OUTPUT' (Sales)
    "amount" DECIMAL(10,2) NOT NULL,
    "referenceId" UUID, -- Link to Sale or Order
    "date" TIMESTAMP DEFAULT now(),
    "isPaid" BOOLEAN DEFAULT false
);

-- 8. Warehouse & Bin Management (WMS)
CREATE TABLE "Warehouse" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT UNIQUE NOT NULL,
    "address" TEXT,
    "isFulfillmentCenter" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "WarehouseBin" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "warehouseId" UUID NOT NULL REFERENCES "Warehouse"("id") ON DELETE CASCADE,
    "zone" TEXT NOT NULL,
    "aisle" TEXT NOT NULL,
    "rack" TEXT NOT NULL,
    "binCode" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "StockTransfer" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "transferNumber" TEXT UNIQUE NOT NULL,
    "fromWarehouseId" UUID NOT NULL REFERENCES "Warehouse"("id"),
    "toWarehouseId" UUID NOT NULL REFERENCES "Warehouse"("id"),
    "status" TEXT DEFAULT 'PENDING', -- PENDING, SHIPPED, RECEIVED, CANCELLED
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- 9. Loyalty Programs & Rewards
CREATE TABLE "LoyaltyAccount" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerId" UUID UNIQUE NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "pointsBalance" INTEGER DEFAULT 0,
    "tierLevel" TEXT DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, PLATINUM
    "lifetimePoints" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "LoyaltyLedger" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "loyaltyAccountId" UUID NOT NULL REFERENCES "LoyaltyAccount"("id") ON DELETE CASCADE,
    "points" INTEGER NOT NULL, -- Positive for Earned, Negative for Redeemed
    "type" TEXT NOT NULL, -- 'EARN', 'REDEEM', 'EXPIRATION', 'BONUS'
    "description" TEXT,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "RewardVoucher" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" TEXT UNIQUE NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2) DEFAULT 0,
    "expiresAt" TIMESTAMP NOT NULL,
    "isRedeemed" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- 10. Subscription Billing Engine
CREATE TABLE "SubscriptionPlan" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT UNIQUE NOT NULL,
    "billingInterval" TEXT DEFAULT 'MONTHLY', -- WEEKLY, MONTHLY, YEARLY
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'INR',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "Subscription" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "planId" UUID NOT NULL REFERENCES "SubscriptionPlan"("id"),
    "status" TEXT DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, CANCELLED, PAUSED
    "currentPeriodStart" TIMESTAMP DEFAULT now(),
    "currentPeriodEnd" TIMESTAMP NOT NULL,
    "autoRenew" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "SubscriptionInvoice" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "subscriptionId" UUID NOT NULL REFERENCES "Subscription"("id") ON DELETE CASCADE,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT DEFAULT 'UNPAID', -- PAID, UNPAID, VOID
    "dueDate" TIMESTAMP NOT NULL,
    "paidAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- 11. CRM & Lead Funnel
CREATE TABLE "Lead" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "stage" TEXT DEFAULT 'NEW', -- NEW, QUALIFIED, PROPOSAL, WON, LOST
    "estimatedValue" DECIMAL(10,2) DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "CustomerInteraction" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerId" UUID REFERENCES "Customer"("id") ON DELETE CASCADE,
    "leadId" UUID REFERENCES "Lead"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL, -- 'CALL', 'EMAIL', 'MEETING', 'NOTE'
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP DEFAULT now()
);

-- 12. POS Shift & Register Session
CREATE TABLE "POSShift" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "cashierName" TEXT NOT NULL,
    "openedAt" TIMESTAMP DEFAULT now(),
    "closedAt" TIMESTAMP,
    "openingFloat" DECIMAL(10,2) NOT NULL,
    "closingCashExpected" DECIMAL(10,2) DEFAULT 0,
    "closingCashActual" DECIMAL(10,2) DEFAULT 0,
    "status" TEXT DEFAULT 'OPEN' -- OPEN, CLOSED
);

-- 13. Vendor & Customer Portal Users
CREATE TABLE "VendorUser" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "supplierId" UUID NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE "CustomerUser" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerId" UUID NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT now()
);

