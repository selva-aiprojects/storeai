import { Response } from 'express';
import prisma from '../lib/prisma';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) return res.status(403).json({ error: 'Tenant context required' });

        // 1. Core Summary Stats
        const [totalRevenue, activeOrders, totalProducts, products] = await Promise.all([
            prisma.sale.aggregate({ where: { tenantId }, _sum: { totalAmount: true } }),
            prisma.order.count({ where: { status: 'PENDING', tenantId } }),
            prisma.product.count({ where: { tenantId, isDeleted: false } }),
            prisma.product.findMany({ where: { tenantId, isDeleted: false }, select: { stockQuantity: true, lowStockThreshold: true } })
        ]);

        // Manually calculate low stock count for SQLite compatibility
        // Note: Even with PG, this logic remains simple and robust
        const lowStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;

        // 2. Chart Data: Monthly Revenue (Last 6 months)
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const monthRevenue = await prisma.sale.aggregate({
                where: {
                    tenantId,
                    createdAt: {
                        gte: start,
                        lte: end
                    }
                },
                _sum: { totalAmount: true }
            });

            chartData.push({
                name: format(date, 'MMM'),
                revenue: monthRevenue._sum.totalAmount || 0
            });
        }

        // 3. Recent Activity
        const recentSales = await prisma.sale.findMany({
            where: { tenantId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                items: { include: { product: true } }
            }
        });

        res.json({
            revenue: totalRevenue._sum.totalAmount || 0,
            activeOrders: activeOrders,
            lowStock: lowStockCount,
            totalProducts: totalProducts,
            recentActivity: recentSales,
            chartData: chartData
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: 'Failed to generate metrics' });
    }
};
