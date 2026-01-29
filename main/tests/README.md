# StoreAI Test Suite

This directory contains the automated testing scripts for the StoreAI platform.

## Contents

- **`regression_suite.ts`**: The main E2E regression test suite. It verifies core workflows (Auth, Sales, HR, Procurement, GST) via API calls.
- **`system_validation.ts`**: A direct-DB validation script (Requires Prisma context).
- **`generate_qa_report.ts`**: Utility to generate quality assurance reports.

## How to Run

### Regression Suite (Recommended)
This script runs pure API tests and is environment-agnostic as long as the server is running.

1. Ensure the **Server** is running on port 5000.
2. Install dependencies (if not globally available):
   ```bash
   npm install axios ts-node typescript @types/node
   ```
3. Run the suite:
   ```bash
   npx ts-node regression_suite.ts
   ```

### System Validation
This script requires access to the `PrismaClient` and the database. It is best run from within the `server` directory context or requires linking to the server's `node_modules`.

## Documentation
For detailed module behavior, refer to the `USER_MANUAL.md` in the `docs` folder.
