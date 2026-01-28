## 1. Cloud Infrastructure & Service Providers
Our architecture leverages industry-leading managed services to ensure high availability and focus on core business logic:
- **Database (DBaaS)**: **Neon PostgreSQL** (Serverless PostgreSQL with instant point-in-time recovery and branchable databases).
- **Application Hosting (PaaS)**: **Render** (Fully managed platform for automatic deployments, SSL, and horizontal scaling of Node.js and Static Sites).
- **Source Control (VCS)**: **Bitbucket** (Enterprise-grade Git repository management with integrated CI/CD pipelines).
- **Static Assets/CDN**: Cloudflare (DDoS protection and edge-cache delivery).

## 2. Environment Topology
We maintain three strictly isolated environments:
1. **Development (Local)**: SQLite/Local Postgres + `ts-node` for rapid iteration.
2. **Staging (UAT)**: Branch `develop` -> Automated deploy to Render (Staging). Mirrors production DB.
3. **Production**: Branch `main` -> Dockerized Deployment.

## 2. CI/CD Pipeline (GitHub Actions)
Every commit to `develop` or `main` triggers the following workflow:
- **Build Phase**: Compiles TypeScript backend and Vite frontend.
- **Verification Phase**: 
    - Runs `regression_suite.ts` to ensure core module integrity.
    - Runs `internal_validation.ts` for database schema drift detection.
- **Deployment Phase (via Render Hooks)**:
    - **Backend**: Builds a multi-stage Docker image and pushes to Render Registry.
    - **Frontend**: Deployed to Render Static Sites for global edge delivery.

## 3. Database Management Strategy
- **Prisma Migrations**: All schema changes must be versioned. 
    - *Command*: `npx prisma migrate deploy` is part of the pre-deployment hook.
- **Connection Pooling**: Use of **Prisma Accelerate** or **PgBouncer** to handle the heavy concurrent load inherent in a multi-tenant SaaS.
- **Backups**: Daily automated snapshots with 30-day retention policies.

## 4. Scalability & Monitoring
- **Horizontal Scaling**: Backend services are stateless, allowing for auto-scaling during rush business hours.
- **Observability**: 
    - **Logging**: Winston-based structured logging for ELK stack compatibility.
    - **APM**: Integration with New Relic or Datadog for tracing slow SQL queries (as identified in our performance audit).

## 5. Security Protocols
- **Secrets Management**: No environment variables (e.g., `DATABASE_URL`) are stored in the repo. Use GitHub Secrets or AWS Secret Manager.
- **CORS Policy**: Strict whitelist of frontend domains.
- **DDoS Protection**: Cloudflare proxy for all production endpoints.

---

**Approved By**: DevOps Architect / Senior Technical Architect
**Timestamp**: 2026-01-28 21:55 UTC
