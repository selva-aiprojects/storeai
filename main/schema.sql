-- Database Schema for Inventory Management System (PostgreSQL)

-- ENUMS
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

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
    "customerId" UUID REFERENCES "Customer"("id"),
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
