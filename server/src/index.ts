import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import salesRoutes from './routes/salesRoutes';
import hrRoutes from './routes/hrRoutes';
import orderRoutes from './routes/orderRoutes';
import supplierRoutes from './routes/supplierRoutes';
import categoryRoutes from './routes/categoryRoutes';
import accountRoutes from './routes/accountRoutes';
import customerRoutes from './routes/customerRoutes';
import payrollRoutes from './routes/payrollRoutes';
import reportRoutes from './routes/reportRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import crmRoutes from './routes/crmRoutes';
import tenantRoutes from './routes/tenantRoutes';
import requisitionRoutes from './routes/requisitionRoutes';
import { getDashboardStats } from './controllers/dashboardController';
import { authenticate } from './middleware/authMiddleware';


console.log('--- ENVIRONMENT CONFIG CHECK ---');
console.log('PORT:', process.env.PORT);
const dbUrl = process.env.DATABASE_URL || '';
const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log('DATABASE_URL (Masked):', maskedDbUrl);
console.log('--------------------------------');

import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://store-ai-prd.onrender.com',
        process.env.CLIENT_URL || ''
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Public Routes
app.use('/api/v1/auth', authRoutes);

// Protected Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/sales', salesRoutes);
app.use('/api/v1/hr', authenticate, hrRoutes);
app.use('/api/v1/orders', authenticate, orderRoutes);
app.use('/api/v1/suppliers', authenticate, supplierRoutes);
app.use('/api/v1/categories', authenticate, categoryRoutes);
app.use('/api/v1/accounts', authenticate, accountRoutes);
app.use('/api/v1/customers', authenticate, customerRoutes);
app.use('/api/v1/hr/payroll', authenticate, payrollRoutes);
app.use('/api/v1/reports', authenticate, reportRoutes);
app.use('/api/v1/inventory', authenticate, inventoryRoutes);
app.use('/api/v1/crm', authenticate, crmRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/requisitions', requisitionRoutes);
app.get('/api/v1/dashboard/stats', authenticate, getDashboardStats);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Only listen if NOT running on Vercel (Vercel handles binding automatically)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 StoreAI Enterprise Server running on port ${PORT}`);
    });
}

export default app;
