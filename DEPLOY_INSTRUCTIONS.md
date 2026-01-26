# Deployment Workflow for Vercel

### Prerequisites
1.  **Vercel Account**: You need a Vercel account (free or pro).
2.  **Bitbucket Connection**: Your Vercel account should be connected to your Bitbucket.

### Steps to Deploy
1.  **Log in to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Import Project**:
    *   Click "Add New..." -> "Project".
    *   Select "Import from Bitbucket" (or select your Bitbucket provider).
    *   Find the `Store-AI` repository and click "Import".
3.  **Configure Project**:
    *   **Framework Preset**: Select "Vite" (it might auto-detect).
    *   **Root Directory**: Leave as `./` (Root).
    *   **Environment Variables**:
        *   `DATABASE_URL`: Your PostgreSQL Connection String (e.g., from Neon, Supabase, or Render).
        *   `JWT_SECRET`: A secure random string.
        *   `VITE_API_URL`: Set this to `/api/v1` (since Vercel handles the routing) or your full Vercel URL + `/api/v1` once deployed.
4.  **Deploy**: Click "Deploy".

### Database Note
Since `database.sqlite` (dev.db) is a local file, it **will not work** in a serverless environment like Vercel effectively (it gets reset on every execution).
**You must provide a PostgreSQL `DATABASE_URL`** in the Vercel Environment Variables.
*   Recommendation: Use a free tier PostgreSQL from **Neon.tech** or **Supabase**.
*   Once you have the `DATABASE_URL`, add it to Vercel.
