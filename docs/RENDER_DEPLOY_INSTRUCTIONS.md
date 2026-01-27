# Deployment Workflow for Render.com

Since you prefer an alternative to Vercel, **Render.com** is the best free option for full-stack apps. It keeps your Backend and Frontend separate but connected.

### Prerequisites
1.  **Render Account**: Log in at [render.com](https://render.com).
2.  **Bitbucket Connection**: Connect your Bitbucket account.

---

### Part 1: Deploy the Backend (Web Service)
1.  On Dashboard, Click **"New +"** -> **"Web Service"**.
2.  Connect your **`Store-AI`** repository.
3.  **Configure Details**:
    *   **Name**: `store-ai-server` (or unique name)
    *   **Root Directory**: `server`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npx prisma generate && npm run build`
    *   **Start Command**: `npm start`
    *   **Instance Type**: `Free`
4.  **Environment Variables** (Add these):
    *   `DATABASE_URL`: `postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
    *   `JWT_SECRET`: `your_secret_key_here`
    *   `NODE_ENV`: `production`
5.  Click **Create Web Service**.
6.  **Copy the Service URL**: Once live, copy the URL (e.g., `https://store-ai-server.onrender.com`). You need this for the Frontend.

---

### Part 2: Deploy the Frontend (Static Site)
1.  On Dashboard, Click **"New +"** -> **"Static Site"**.
2.  Connect the same **`Store-AI`** repository.
3.  **Configure Details**:
    *   **Name**: `store-ai-client`
    *   **Root Directory**: `client`
    *   **Build Command**: `npm install && npm run build`
    *   **Publish Directory**: `dist`
4.  **Environment Variables**:
    *   `VITE_API_URL`: Paste your **Backend URL** from Part 1 + `/api/v1`
        *   *Example*: `https://store-ai-server.onrender.com/api/v1`
5.  Click **Create Static Site**.

### Done!
Your app will be live at the **Static Site URL** provided by Render.
