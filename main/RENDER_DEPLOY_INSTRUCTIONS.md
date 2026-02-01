# Deployment Workflow for Render.com

StoreAI requires **3 services** on Render: Node.js Backend, Python AI Backend, and Static Frontend.

### Prerequisites
1.  **Render Account**: Log in at [render.com](https://render.com).
2.  **Bitbucket Connection**: Connect your Bitbucket account.

---

### Part 1: Deploy the Node.js Backend (Web Service)
1.  On Dashboard, Click **"New +"** -> **"Web Service"**.
2.  Connect your **`Store-AI`** repository.
3.  **Configure Details**:
    *   **Name**: `store-ai-server`
    *   **Root Directory**: `main/server`  <-- IMPORTANT: Must be main/server
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install && npx prisma generate && npm run build`
    *   **Start Command**: `npm start`
    *   **Instance Type**: `Free`
4.  **Environment Variables**:
    *   `DATABASE_URL`: Your Neon PostgreSQL URL
    *   `JWT_SECRET`: Strong secret key (same as Python backend!)
    *   `NODE_ENV`: `production`
5.  Click **Create Web Service**.
6.  **Copy the Service URL** (e.g., `https://store-ai-server.onrender.com`).

---

### Part 2: Deploy the Python AI Backend (Web Service)
**Do this if you haven't already!**

1.  On Dashboard, Click **"New +"** -> **"Web Service"**.
2.  Connect the same repository.
3.  **Configure Details**:
    *   **Name**: `store-ai-python`
    *   **Root Directory**: `python_backend`
    *   **Runtime**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `python main.py`
    *   **Instance Type**: `Free`
4.  **Environment Variables**:
    *   `DATABASE_URL`: Same as Node.js backend
    *   `JWT_SECRET`: **Current Value**: `MqOqO1LLP8PK8DRwe9NenNZfmquJz1POzdcbDJ+gbL4=` (Must match Node.js!)
    *   `GROQ_API_KEY`: Your Groq API key
    *   `GOOGLE_API_KEY`: Your Google Gemini API key
    *   `PORT`: `8000`
5.  Click **Create Web Service**.
6.  **Copy the Service URL** (e.g., `https://store-ai-python.onrender.com`).

---

### Part 3: Update Frontend Configuration
**The Frontend needs to know where the AI lives.**

1.  Go to **`store-ai-client`** service settings.
2.  **Environment Variables**:
    *   `VITE_API_URL`: `https://store-ai-server.onrender.com/api/v1`
    *   `VITE_AI_API_URL`: **Paste your Python Service URL here** + `/api`
        *   Example: `https://store-ai-python.onrender.com/api`
3.  **Save and Redeploy** the Client.

---

### Important: JWT_SECRET Must Match!

> ⚠️ The `JWT_SECRET` must be **identical** on both Node.js and Python backends, or AI authentication will fail!

### Done!
Your app will be live at the **Static Site URL** provided by Render.
