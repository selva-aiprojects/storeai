import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDepartmentalReport = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        const [salesByTeam, inventoryValuation, hrSummary, financialHealth] = await Promise.all([
            // 1. Sales Report by Team
            prisma.sale.groupBy({
                by: ['team'],
                where: { isDeleted: false, tenantId },
                _sum: { totalAmount: true },
                _count: { id: true }
            }),

            // 2. Inventory Valuation
            prisma.product.aggregate({
                where: { isDeleted: false, tenantId },
                _sum: {
                    stockQuantity: true,
                }
            }),

            // 3. HR Summary (Attendance Rate & Payroll)
            prisma.employee.count({
                where: { isDeleted: false, department: { tenantId } }
            }),

            // 4. Financial Health (Total Receivables vs Payables)
            prisma.ledger.groupBy({
                by: ['type'],
                where: { tenantId },
                _sum: { amount: true }
            })
        ]);

        // Deep dive for Stock Valuation (Manual sum as price * stock is not a groupable aggregate)
        const products = await prisma.product.findMany({ where: { isDeleted: false, tenantId } });
        const totalStockValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.price), 0);

        res.json({
            sales: salesByTeam,
            inventory: {
                totalQuantity: inventoryValuation._sum.stockQuantity,
                totalValue: totalStockValue
            },
            hr: {
                totalEmployees: hrSummary
            },
            finance: financialHealth
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate comprehensive report' });
    }
};

export const getInventoryReport = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const products = await prisma.product.findMany({
            where: { isDeleted: false, tenantId },
            include: { category: true }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch inventory report' });
    }
};

export const getAuditLog = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const [deletedProducts, deletedEmployees] = await Promise.all([
            prisma.product.findMany({
                where: { isDeleted: true, tenantId },
                include: { category: true }
            }),
            prisma.employee.findMany({
                where: { isDeleted: true, department: { tenantId } },
                include: { user: true, department: true }
            })
        ]);

        res.json({
            products: deletedProducts,
            employees: deletedEmployees
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
};

export const getPredictionReport = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const products = await prisma.product.findMany({
            where: { isDeleted: false, tenantId },
            include: { category: true }
        });

        // Simple Moving Average (SMA) Logic
        const predictions = products.map(p => {
            const burnRate = p.avgDailySales || 0.1; // fallback to very low burn
            const daysLeft = p.stockQuantity / burnRate;
            const stockOutDate = new Date();
            stockOutDate.setDate(stockOutDate.getDate() + daysLeft);

            const isUrgent = daysLeft < p.leadTimeDays;
            const suggestedReorder = isUrgent ? (p.leadTimeDays * burnRate * 2) : 0; // Target 2x safety stock

            return {
                id: p.id,
                name: p.name,
                stock: p.stockQuantity,
                burnRate,
                daysLeft: Math.floor(daysLeft),
                stockOutDate: stockOutDate.toISOString().split('T')[0],
                status: isUrgent ? 'CRITICAL' : (daysLeft < 30 ? 'WARNING' : 'HEALTHY'),
                suggestedReorder: Math.ceil(suggestedReorder)
            };
        });

        // Sort by urgency
        predictions.sort((a, b) => a.daysLeft - b.daysLeft);

        res.json(predictions.slice(0, 10)); // Top 10 risks
    } catch (e) {
        res.status(500).json({ error: 'Failed to generate predictions' });
    }
};

export const getFinancialPerformance = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { year } = req.query;
        const currentYear = year ? parseInt(year as string) : new Date().getFullYear();

        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);

        const [sales, purchases, payrolls] = await Promise.all([
            prisma.sale.findMany({ where: { tenantId, createdAt: { gte: startDate, lte: endDate }, isDeleted: false } }),
            prisma.order.findMany({ where: { tenantId, createdAt: { gte: startDate, lte: endDate }, isDeleted: false, status: { in: ['COMPLETED', 'PARTIAL_RECEIVED', 'APPROVED', 'SHIPPED'] } } }),
            prisma.payroll.findMany({
                where: {
                    employee: { department: { tenantId } },
                    createdAt: { gte: startDate, lte: endDate }
                }
            })
        ]);

        // Monthly Aggregation
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            sales: 0,
            procurement: 0,
            expenses: 0,
            gstCollected: 0
        }));

        sales.forEach(s => {
            const m = s.createdAt.getMonth();
            monthlyData[m].sales += s.totalAmount;
            monthlyData[m].gstCollected += s.taxAmount;
        });

        purchases.forEach(p => {
            const m = p.createdAt.getMonth();
            monthlyData[m].procurement += p.totalAmount;
        });

        payrolls.forEach(p => {
            const m = (p.createdAt).getMonth();
            monthlyData[m].expenses += p.totalPayout;
        });

        const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalGst = sales.reduce((acc, s) => acc + s.taxAmount, 0);
        const totalExpenses = monthlyData.reduce((acc, m) => acc + m.expenses + m.procurement, 0);

        // Simple Income Tax Calculation (e.g., 25% of Profit)
        const profit = totalRevenue - totalExpenses;
        const incomeTax = profit > 0 ? profit * 0.25 : 0;

        // Expenditure Forecast (Next 3 months based on average of last 3 months)
        const last3Months = monthlyData.slice(new Date().getMonth() - 2, new Date().getMonth() + 1);
        const avgMonthlyExpense = last3Months.reduce((acc, m) => acc + m.expenses + m.procurement, 0) / (last3Months.length || 1);
        const forecast = avgMonthlyExpense * 1.1; // 10% buffering for safety

        res.json({
            monthlyData,
            summary: {
                totalRevenue,
                totalGst,
                totalExpenses,
                profit,
                incomeTax,
                expenditureForecast: forecast
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
};

export const getBatchIntegrityReport = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // Use raw query for the specific view
        const report = await prisma.$queryRaw`SELECT * FROM "vw_batch_expiry" WHERE "tenantId" = ${tenantId} ORDER BY "expiryDate" ASC`;
        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch batch integrity report' });
    }
};
