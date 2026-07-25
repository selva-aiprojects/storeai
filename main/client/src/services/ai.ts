import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;
const rawAiUrl = import.meta.env.VITE_AI_API_URL || `${API_URL}/ai`;
const AI_API_URL = rawAiUrl.replace(/\/+$/, '');

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
    return Promise.reject(error);
});

export const chatWithAI = async (query: string, history: any[] = []) => {
    try {
        const response = await aiApi.post('/chat', { query, history });
        return response.data;
    } catch (primaryError: any) {
        console.warn("Primary AI endpoint unreachable, attempting fallback to core Express AI service...", primaryError);
        const fallbackUrl = `${API_URL}/ai/chat`;
        try {
            const token = localStorage.getItem('store_ai_token');
            const fallbackResponse = await axios.post(fallbackUrl, { query, history }, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                timeout: 60000
            });
            return fallbackResponse.data;
        } catch (fallbackError) {
            console.error("Fallback AI Chat Error:", fallbackError);
            throw primaryError;
        }
    }
};

export default aiApi;
