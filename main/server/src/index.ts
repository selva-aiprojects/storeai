import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger, httpLogStream } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

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
import financeRoutes from './routes/financeRoutes';
import auditRoutes from './routes/auditRoutes';
import { getDashboardStats } from './controllers/dashboardController';
import { authenticate } from './middleware/authMiddleware';

logger.info('--- ENVIRONMENT CONFIG CHECK ---');
logger.info(`PORT: ${process.env.PORT}`);
const dbUrl = process.env.DATABASE_URL || '';
const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
logger.info(`DATABASE_URL (Masked): ${maskedDbUrl}`);
logger.info('--------------------------------');

import compression from 'compression';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:5173',
        'https://store-ai-prd.onrender.com',
        process.env.CLIENT_URL || ''
    ],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// HTTP Request logging with Morgan + Winston
app.use(morgan('combined', { stream: httpLogStream }));

// Initialize scheduled jobs (audit log archival, etc.)
import initializeScheduledJobs from './utils/scheduler';
if (process.env.NODE_ENV !== 'test') {
    initializeScheduledJobs();
}


// Public Routes
app.use('/api/v1/auth', authRoutes);

// Audit middleware for protected routes (tracks all mutations)
import auditMiddleware from './middleware/auditMiddleware';
app.use('/api/v1', auditMiddleware);

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
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.get('/api/v1/dashboard/stats', authenticate, getDashboardStats);

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Only listen if NOT running on Vercel (Vercel handles binding automatically)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        logger.info(`🚀 StoreAI Enterprise Server running on port ${PORT}`);
    });
}

export default app;
