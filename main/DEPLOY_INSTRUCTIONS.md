# Deployment Guide (Vercel + Render)

## Architecture

| Service        | Platform | Directory        | Type                          |
|----------------|----------|------------------|-------------------------------|
| Frontend       | Vercel   | `main/client`    | Vite static site              |
| Backend (Node) | Vercel   | `main/server`    | Express serverless function   |
| Backend (Python) | Render | `python_backend` | FastAPI web service (free)    |
| Database       | Neon     | —                | PostgreSQL (serverless)       |

## Deploy the Node.js Backend to Vercel

1. Go to [vercel.com](https://vercel.com) and log in.
2. Click **Add New → Project**.
3. Import your repository (Bitbucket/GitHub).
4. **Root Directory**: select `main/server`.
5. **Framework Preset**: should auto-detect as `Other`.
6. **Build & Output Settings** — leave defaults (`@vercel/node` handles it via `vercel.json`).
7. **Environment Variables**:

   **Required:**
   | Key                       | Value                                                        |
   |---------------------------|--------------------------------------------------------------|
   | `DATABASE_URL`            | `postgresql://neondb_owner:npg_...@ep-...neon.tech/neondb?sslmode=require` |
   | `JWT_SECRET`              | `MqOqO1LLP8PK8DRwe9NenNZfmquJz1POzdcbDJ+gbL4=` (or a new one) |
   | `AUTO_FIX_ADMIN_ON_BOOT`  | `true`                                                       |
   | `INITIAL_ADMIN_EMAIL`     | `admin@storeai.com`                                          |
   | `INITIAL_ADMIN_PASSWORD`  | `Admin@123`                                                  |
   | `CLIENT_URL`              | `https://<your-frontend>.vercel.app`                         |

   **Optional (defaults work):**
   | Key                         | Default                    |
   |-----------------------------|----------------------------|
   | `INITIAL_ADMIN_TENANT_SLUG` | `storeai`                  |
   | `INITIAL_ADMIN_TENANT_NAME` | `StoreAI Corporate Hub`    |
   | `JWT_EXPIRES_IN`            | `1d`                       |
   | `NODE_ENV`                  | `production` recommended   |
   | `LOG_LEVEL`                 | `info`                     |

8. Click **Deploy**.
9. Note the deployment URL (e.g. `https://store-ai-server.vercel.app`).

## Deploy the Frontend to Vercel

1. Click **Add New → Project** in the same Vercel team (or create a separate project).
2. Import the same repository.
3. **Root Directory**: select `main/client`.
4. **Framework Preset**: `Vite` (auto-detected).
5. **Build & Output Settings**: leave defaults.
6. **Environment Variables**:

   | Key              | Value                                                    |
   |------------------|----------------------------------------------------------|
   | `VITE_API_URL`   | `https://<your-backend>.vercel.app/api/v1`               |
   | `VITE_AI_API_URL` | `https://store-ai-python.onrender.com/api` (keep Render URL) |

7. Click **Deploy**.

## Keep Python Backend on Render

The Python AI backend stays on Render's free tier — no changes needed.
It already has the Neon database connection and CORS updated to allow Vercel origins.

## Post-Deployment Checklist

- [ ] Backend health: `GET https://<backend-url>/api/health` → `{ "status": "UP", ... }`
- [ ] Frontend loads and can log in with admin credentials
- [ ] AI features reachable (Python backend on Render)
- [ ] CORS not blocking requests (check browser console)

## Troubleshooting

**Prisma errors on Vercel:**
Make sure `DATABASE_URL` is set correctly. The `postinstall` script runs `prisma generate` automatically during build.

**CORS errors:**
Ensure the backend's `CLIENT_URL` env var is set to your frontend Vercel URL. Both the Node server and Python backend now accept `*.vercel.app` origins.

**Cold starts:**
Serverless functions may take a few seconds on first request after inactivity. Vercel Pro has a "keep alive" option to reduce cold starts.
