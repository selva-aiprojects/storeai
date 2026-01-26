# API Routes Design

Base URL: `/api/v1`

## 1. Authentication (`/auth`)
- `POST /login`: Authenticate user and return JWT
- `POST /register`: Create new user (Role-restricted)
- `GET /me`: Get current user profile
- `POST /logout`: Invalidate session

## 2. Product Management (`/products`)
- `GET /products`: List all products (with filters/pagination)
- `POST /products`: Add new product
- `GET /products/:id`: Get product details
- `PUT /products/:id`: Update product
- `DELETE /products/:id`: Remove product
- `GET /categories`: List all categories
- `POST /categories`: Create new category

## 3. Order Management (`/orders`)
- `GET /orders`: List purchase orders
- `POST /orders`: Create new purchase order from supplier
- `GET /orders/:id`: Detailed view of an order
- `PATCH /orders/:id/status`: Update status (Pending -> Received)
- `GET /suppliers`: List suppliers
- `POST /suppliers`: Register new supplier

## 4. Sales Management (`/sales`)
- `GET /sales`: List sales records
- `POST /sales`: Process a new sale (checkout)
- `GET /sales/:id`: View invoice details
- `GET /customers`: List customers
- `POST /customers`: Register a customer

## 5. HR Management (`/hr`)
- `GET /employees`: List employees
- `POST /employees`: Onboard new employee
- `GET /employees/:id`: View employee profile
- `GET /departments`: List departments

## 6. Account Management (`/accounts`)
- `GET /ledgers`: View financial ledger entries
- `GET /payments`: View transaction history
- `GET /reports/profit-loss`: Generate profit/loss summary

## 7. Dashboard (`/dashboard`)
- `GET /stats/summary`: Get top-level metrics (Total Sales, Stock Value, etc.)
- `GET /stats/low-stock`: List products below threshold
- `GET /stats/recent-activity`: Recent orders and sales
