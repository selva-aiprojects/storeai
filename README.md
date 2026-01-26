# AI-Powered Inventory Management System (IMS)

A comprehensive, deployment-ready Inventory Management System designed with clean architecture principles.

## Tech Stack
- **Backend:** Node.js (Express) with TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Frontend:** React + Tailwind CSS
- **Authentication:** JWT with Role-Based Access Control (RBAC)
- **Deployment:** Docker & Docker Compose

## Core Modules
1. **Order Management**: Handle purchase orders from suppliers.
2. **Product Management**: Inventory tracking, categories, and stock alerts.
3. **Sales Management**: Customer invoices and point-of-sale functionality.
4. **Account Management**: Financial ledgers and transaction history.
5. **HR Management**: Employee records, departments, and payroll basics.
6. **Consolidated Dashboard**: Real-time analytics and KPIs.
7. **Tool/Admin Management**: System settings, user roles, and audit logs.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL (if running locally without Docker)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Store-AI
   ```

2. Setup Environment:
   ```bash
   cp .env.template .env
   ```

3. Setup Backend:
   ```bash
   cd server
   npm install
   npx prisma migrate dev
   npm run dev
   ```

4. Setup Frontend:
   ```bash
   cd client
   npm install
   npm run dev
   ```

### Docker Deployment
```bash
docker-compose up -d
```

## API Documentation
The API follows RESTful principles. Base URL: `/api/v1`.
Detailed route list can be found in `server/src/routes`.