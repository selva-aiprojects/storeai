import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;
console.log('?? API Service Initialized. connection to:', API_URL);

const api = axios.create({
    baseURL: API_URL,
});

const cache = new Map();
const CACHE_TTL = 60000; // Increased to 60s for better performance

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

api.interceptors.request.use((config) => {
    updateProgress(true);
    const token = localStorage.getItem('store_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get') {
        const cached = cache.get(config.url);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            updateProgress(false); // Immediate finish for cache hit
            config.adapter = (cfg: any) => Promise.resolve({
                data: cached.data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: cfg,
                request: {}
            });
        }
    }
    return config;
}, (error) => {
    updateProgress(false);
    return Promise.reject(error);
});

api.interceptors.response.use((response) => {
    updateProgress(false);
    if (response.config.method === 'get') {
        cache.set(response.config.url, {
            data: response.data,
            timestamp: Date.now()
        });
    }
    return response;
}, (error) => {
    updateProgress(false);
    return Promise.reject(error);
});

// Auth
export const login = (credentials: any) => api.post('/auth/login', credentials);
export const register = (data: any) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Attendance
export const getDailyAttendance = (date: string) => api.get(`/attendance?date=${date}`);
export const markDailyAttendance = (data: any) => api.post('/attendance', data);

// Products
export const getProducts = () => api.get('/products');
export const getGlobalProducts = () => api.get('/products/all');
export const createProduct = (data: any) => api.post('/products', data);
export const updateProduct = (id: string, data: any) => api.patch(`/products/${id}`, data);
export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data: any) => api.post('/suppliers', data);
export const updateSupplier = (id: string, data: any) => api.patch(`/suppliers/${id}`, data);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data: any) => api.post('/categories', data);

// Orders (PO Lifecycle)
export const getOrders = () => api.get('/orders');
export const createOrder = (data: any) => api.post('/orders', data);
export const approveOrder = (id: string, userId: string) => api.patch(`/orders/${id}/approve`, { userId }); // New
export const createGoodsReceipt = (id: string, data: any) => api.post(`/orders/${id}/grn`, data); // New (Replaces receiveOrder)
// Deprecated but keeping for backward compat if needed temporarily
export const receiveOrder = (id: string) => api.patch(`/orders/${id}/receive`);

// Sales
export const getSales = () => api.get('/sales');
export const createSale = (data: any) => api.post('/sales', data);

// HR
export const getEmployees = () => api.get('/hr/employees');
export const createEmployee = (data: any) => api.post('/hr/employees', data);
export const getDepartments = () => api.get('/hr/departments');
// export const markAttendance = (data: any) => api.post('/hr/attendance', data); // Deprecated
export const updatePerformance = (id: string, rating: number) => api.patch(`/hr/performance/${id}`, { performanceRating: rating });
export const getPayrolls = () => api.get('/hr/payroll');
export const createPayroll = (data: any) => api.post('/hr/payroll', data);
export const generatePayroll = (data: any) => api.post('/hr/payroll/generate', data); // New Endpoint

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: string, data: any) => api.put(`/users/${id}`, data);

// Customers
export const getCustomers = () => api.get('/customers');
export const createCustomer = (data: any) => api.post('/customers', data);

// Requisitions
export const getRequisitions = () => api.get('/requisitions');
export const createRequisition = (data: any) => api.post('/requisitions', data);
export const updateRequisitionStatus = (id: string, status: string) => api.patch(`/requisitions/${id}/status`, { status });

// Analytics
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
