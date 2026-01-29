# Docker Deployment Instructions

Since your project is configured with Docker, deploying to any cloud provider that supports containers (like DigitalOcean, AWS ECS, Google Cloud Run, or Azure) is very standard.

### Local Testing (Production Mode)
You can verify the production build locally:
```bash
docker-compose up --build
```
This will start:
*   Frontend (Nginx) at `http://localhost:3000` (Mapped to port 80 internally)
*   Backend (Node) at `http://localhost:5000`
*   Database (Postgres)

---

### Option 1: DigitalOcean App Platform (Easiest for Docker)
1.  Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com/apps).
2.  Click **Create App**.
3.  Select **Bitbucket** and your repository.
4.  **Auto-Detection**: It will detect the `Dockerfile` in `server` and `client`.
5.  **Edit Configuration**:
    *   **Database**: Add a Managed Postgres Database ( ~$15/mo) OR use your existing Neon URL as an env var.
    *   **Env Variables (Server)**:
        *   `DATABASE_URL`: `${db.DATABASE_URL}` (if managed) or your Neon URL.
        *   `JWT_SECRET`: `...`
6.  **Deploy**.

### Option 2: Render.com (Docker Support)
Render also supports deploying from `Docker`:
1.  When creating a **Web Service**, change "Runtime" from `Node` to `Docker`.
2.  Point it to the `server/Dockerfile`.
3.  Repeat for Client if needed, or stick to Static Site for Client (cheaper/free).

### Option 3: AWS / Azure / GCP
You would build the images and push them to ECR/ACR/GCR, then run them on ECS/App Service/Cloud Run.
