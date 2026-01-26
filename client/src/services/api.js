import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
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
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
// Products
export const getProducts = () => api.get('/products');
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.patch(`/suppliers/${id}`, data);
// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
// Orders
export const getOrders = () => api.get('/orders');
export const createOrder = (data) => api.post('/orders', data);
export const receiveOrder = (id) => api.patch(`/orders/${id}/receive`);
// Sales
export const getSales = () => api.get('/sales');
export const createSale = (data) => api.post('/sales', data);
// HR
export const getEmployees = () => api.get('/hr/employees');
export const createEmployee = (data) => api.post('/hr/employees', data);
export const getDepartments = () => api.get('/hr/departments');
export const markAttendance = (data) => api.post('/hr/attendance', data);
export const updatePerformance = (id, rating) => api.patch(`/hr/performance/${id}`, { performanceRating: rating });
export const getPayrolls = () => api.get('/hr/payroll');
export const createPayroll = (data) => api.post('/hr/payroll', data);
// Users
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
// Customers
export const getCustomers = () => api.get('/customers');
export const createCustomer = (data) => api.post('/customers', data);
// Analytics
export const getDashboardStats = () => api.get('/dashboard/stats');
export default api;
//# sourceMappingURL=api.js.map