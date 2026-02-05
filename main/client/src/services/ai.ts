import axios from 'axios';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000/api';

const aiApi = axios.create({
    baseURL: AI_API_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// --- Progress Control (Hourglass Fix) ---
let activeRequests = 0;
const updateProgress = (show: boolean) => {
    let bar = document.getElementById('top-progress-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'top-progress-bar';
        document.body.appendChild(bar);
    }

    if (show) {
        activeRequests++;
        bar.style.opacity = '1';
        bar.style.width = activeRequests > 1 ? '70%' : '30%';
        setTimeout(() => { if (activeRequests > 0) bar!.style.width = '90%'; }, 200);
    } else {
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests === 0) {
            bar.style.width = '100%';
            setTimeout(() => {
                if (activeRequests === 0) {
                    bar!.style.opacity = '0';
                    setTimeout(() => { if (activeRequests === 0) bar!.style.width = '0%'; }, 400);
                }
            }, 300);
        }
    }
};

// Add Auth Token Interceptor
aiApi.interceptors.request.use((config) => {
    updateProgress(true);
    const token = localStorage.getItem('store_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    updateProgress(false);
    return Promise.reject(error);
});

aiApi.interceptors.response.use((response) => {
    updateProgress(false);
    return response;
}, (error) => {
    updateProgress(false);
    if (error.response?.status === 401) {
        // Option: handle redirect to login or show modal
        // For now, let the component handle the error which it already does
    }
    return Promise.reject(error);
});

export const chatWithAI = async (query: string, history: any[] = []) => {
    try {
        const response = await aiApi.post('/chat', { query, history });
        return response.data;
    } catch (error) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

export const getMarketResearch = async () => {
    try {
        const response = await aiApi.get('/ai/market-research');
        return response.data;
    } catch (error) {
        console.error("Market Research Error:", error);
        throw error;
    }
};

export default aiApi;
