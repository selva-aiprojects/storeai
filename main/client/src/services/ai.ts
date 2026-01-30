import axios from 'axios';

const AI_API_URL = 'http://localhost:8000/api';

const aiApi = axios.create({
    baseURL: AI_API_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    }
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

export default aiApi;
