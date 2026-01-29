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
import Financials from './pages/Financials';
import Products from './pages/Products';
import Assistant from './pages/Assistant';

function App() {
    const [user, setUser] = useState<any>(null);
    const [modal, setModal] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>({
        products: [], users: [], sales: [], orders: [],
        employees: [], suppliers: [], categories: [], ledger: [],
        financialSummary: null, stats: null, departments: [],
        customers: [], payrolls: [], reports: null, taxSummary: null, tenants: [],
        requisitions: []
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

    const refreshData = async (scope: 'essential' | 'full' | string = 'essential') => {
        setLoading(true);

        const updates: any = {};
        const safeFetch = async (endpoint: string, key: string) => {
            try {
                const resp = await api.get(endpoint);
                updates[key] = resp.data;
            } catch (e) {
                updates[key] = Array.isArray(data[key]) ? [] : null;
            }
        };

        const safeFetchService = async (serviceCall: () => Promise<any>, key: string) => {
            try {
                const resp = await serviceCall();
                updates[key] = resp.data;
            } catch (e) {
                updates[key] = Array.isArray(data[key]) ? [] : null;
            }
        };

        // Execution Groups
        const essentialTasks = [
            safeFetch('/dashboard/stats', 'stats'),
            safeFetchService(getProducts, 'products'),
            safeFetchService(getCategories, 'categories'),
        ];

        const salesTasks = [
            safeFetchService(getSales, 'sales'),
            safeFetchService(getCustomers, 'customers'),
        ];

        const purchaseTasks = [
            safeFetch('/orders', 'orders'),
            safeFetchService(getSuppliers, 'suppliers'),
            safeFetch('/inventory/warehouses', 'warehouses'),
            safeFetch('/requisitions', 'requisitions'),
        ];

        const hrTasks = [
            safeFetchService(getEmployees, 'employees'),
            safeFetchService(getPayrolls, 'payrolls'),
        ];

        const financeTasks = [
            safeFetch('/accounts/ledger', 'ledger'),
            safeFetch('/accounts/summary', 'financialSummary'),
            safeFetch('/accounts/tax-summary', 'taxSummary'),
            safeFetch('/payment', 'transactions'),
        ];

        const intelTasks = [
            safeFetch('/reports/comprehensive', 'reports'),
            safeFetch('/crm', 'deals'),
        ];

        // Intelligent Loading Strategy
        if (scope === 'full') {
            await Promise.all([...essentialTasks, ...salesTasks, ...purchaseTasks, ...hrTasks, ...financeTasks, ...intelTasks]);
        } else if (scope === 'sales') {
            await Promise.all([...essentialTasks, ...salesTasks]);
        } else if (scope === 'purchases') {
            await Promise.all([...essentialTasks, ...purchaseTasks]);
        } else if (scope === 'hr') {
            await Promise.all([...essentialTasks, ...hrTasks]);
        } else if (scope === 'finance') {
            await Promise.all([...essentialTasks, ...financeTasks]);
        } else {
            await Promise.all(essentialTasks);
        }

        if (user?.activeTenant?.slug === 'storeai') {
            await safeFetch('/tenants/all', 'tenants');
        }

        setData((prev: any) => ({ ...prev, ...updates }));
        setLoading(false);
    };

    return (
        <Router>
            {!user ? (
                <Login setUser={setUser} />
            ) : (
                <Routes>
                    <Route element={<DashboardLayout user={user} logout={() => { localStorage.removeItem('store_ai_token'); setUser(null); }} refreshData={refreshData} setModal={setModal} data={data} loading={loading} />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/partners" element={<Partners />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/hr" element={<HR />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/financials" element={<Financials />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/assistant" element={<Assistant />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            )}

            <AnimatePresence>
                {modal && (
                    <FormModal
                        type={modal.type}
                        metadata={modal.metadata}
                        onClose={() => {
                            const type = modal.type;
                            let scope = 'essential';
                            if (['sales', 'customers'].includes(type)) scope = 'sales';
                            if (['orders', 'purchases', 'grn', 'suppliers', 'requisitions'].includes(type)) scope = 'purchases';
                            if (['employees', 'payroll', 'generate_all_payroll'].includes(type)) scope = 'hr';
                            if (['payment'].includes(type)) scope = 'finance';

                            setModal(null);
                            refreshData(scope);
                        }}
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
