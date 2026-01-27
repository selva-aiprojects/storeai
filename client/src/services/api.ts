import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
console.log('🔌 API Service Initialized. connection to:', API_URL);

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('store_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = (credentials: any) => api.post('/auth/login', credentials);
export const register = (data: any) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data: any) => api.post('/products', data);
export const updateProduct = (id: string, data: any) => api.patch(`/products/${id}`, data);

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
export const markAttendance = (data: any) => api.post('/hr/attendance', data);
export const updatePerformance = (id: string, rating: number) => api.patch(`/hr/performance/${id}`, { performanceRating: rating });
export const getPayrolls = () => api.get('/hr/payroll');
export const createPayroll = (data: any) => api.post('/hr/payroll', data);

// Users
export const getUsers = () => api.get('/users');
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: string, data: any) => api.put(`/users/${id}`, data);

// Customers
export const getCustomers = () => api.get('/customers');
export const createCustomer = (data: any) => api.post('/customers', data);

// Analytics
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
