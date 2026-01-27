import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import api, {
    getProducts, getMe, getSales, getSuppliers, getCategories,
    getEmployees, getDepartments, getUsers, getCustomers, getPayrolls
} from './services/api';

// Layouts & Components
import DashboardLayout from './layouts/DashboardLayout';
import FormModal from './components/FormModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Partners from './pages/Partners';
import Customers from './pages/Customers';
import HR from './pages/HR';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';

function App() {
    const [user, setUser] = useState<any>(null);
    const [modal, setModal] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>({
        products: [], users: [], sales: [], orders: [],
        employees: [], suppliers: [], categories: [], ledger: [],
        financialSummary: null, stats: null, departments: [],
        customers: [], payrolls: [], reports: null, taxSummary: null, tenants: []
    });

    useEffect(() => {
        const token = localStorage.getItem('store_ai_token');
        if (token) fetchMe();
    }, []);

    useEffect(() => {
        if (user) refreshData();
    }, [user]);

    const fetchMe = async () => {
        try {
            const resp = await getMe();
            setUser(resp.data);
        } catch (e) { localStorage.removeItem('store_ai_token'); }
    };

    const refreshData = async () => {
        setLoading(true);
        const newData: any = { ...data };

        const safeFetch = async (endpoint: string, key: string, transform: (d: any) => any = (d) => d) => {
            try {
                const resp = await api.get(endpoint);
                newData[key] = transform(resp.data);
            } catch (e) {
                // console.warn(`Failed to fetch ${endpoint}:`, e);
                newData[key] = Array.isArray(data[key]) ? [] : null;
            }
        };

        const safeFetchService = async (serviceCall: () => Promise<any>, key: string) => {
            try {
                const resp = await serviceCall();
                newData[key] = resp.data;
            } catch (e) {
                // console.warn(`Failed to call service for ${key}:`, e);
                newData[key] = Array.isArray(data[key]) ? [] : null;
            }
        };

        await Promise.all([
            safeFetch('/dashboard/stats', 'stats'),
            safeFetchService(getProducts, 'products'),
            safeFetchService(getSales, 'sales'),
            safeFetch('/orders', 'orders'),
            safeFetchService(getUsers, 'users'),
            safeFetch('/payment', 'transactions'),
            safeFetch('/accounts/ledger', 'ledger'),
            safeFetch('/accounts/summary', 'financialSummary'),
            safeFetch('/inventory/warehouses', 'warehouses'),
            safeFetchService(getSuppliers, 'suppliers'),
            safeFetchService(getCategories, 'categories'),
            safeFetchService(getEmployees, 'employees'),
            safeFetchService(getPayrolls, 'payrolls'),
            safeFetchService(getCustomers, 'customers'),
            safeFetch('/reports/comprehensive', 'reports'),
            safeFetch('/crm', 'deals'),
            safeFetch('/accounts/tax-summary', 'taxSummary'),
            user?.activeTenant?.slug === 'storeai' ? safeFetch('/tenants/all', 'tenants') : Promise.resolve()
        ]);

        setData(newData);
        setLoading(false);
    };

    return (
        <Router>
            {!user ? (
                <Login setUser={setUser} />
            ) : (
                <Routes>
                    <Route element={<DashboardLayout user={user} logout={() => { localStorage.removeItem('store_ai_token'); setUser(null); }} refreshData={refreshData} setModal={setModal} data={data} />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/partners" element={<Partners />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/hr" element={<HR />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            )}

            <AnimatePresence>
                {modal && (
                    <FormModal
                        type={modal.type}
                        metadata={modal.metadata}
                        onClose={() => { setModal(null); refreshData(); }}
                        categories={data.categories}
                        suppliers={data.suppliers}
                        products={data.products}
                        departments={data.departments}
                        users={data.users}
                        customers={data.customers}
                        employees={data.employees}
                        warehouses={data.warehouses}
                        tenants={data.tenants}
                        user={user}
                    />
                )}
            </AnimatePresence>
        </Router>
    );
}

export default App;
