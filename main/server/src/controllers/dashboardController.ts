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

        // 2. Chart Data: Monthly Revenue (Last 6 months) - OPTIMIZED: Bulk fetch and manual aggregation
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
        const salesData = await prisma.sale.findMany({
            where: {
                tenantId,
                createdAt: { gte: sixMonthsAgo },
                isDeleted: false
            },
            select: { totalAmount: true, createdAt: true }
        });

        const monthOffsets = [5, 4, 3, 2, 1, 0];
        const chartData = monthOffsets.map(i => {
            const date = subMonths(new Date(), i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const revenue = salesData
                .filter(s => s.createdAt >= start && s.createdAt <= end)
                .reduce((acc, s) => acc + s.totalAmount, 0);

            return {
                name: format(date, 'MMM'),
                revenue
            };
        });

        // 3. Activity Counts
        const [activityCounts, totalProcurement] = await Promise.all([
            prisma.sale.groupBy({
                by: ['status'],
                where: { tenantId, isDeleted: false },
                _count: true
            }),
            prisma.order.aggregate({ where: { tenantId, isDeleted: false }, _sum: { totalAmount: true } })
        ]);

        const activity: any = {
            toBePacked: activityCounts.find(c => c.status === 'PENDING')?._count || 0,
            toBeShipped: activityCounts.find(c => c.status === 'PACKED')?._count || 0,
            toBeDelivered: activityCounts.find(c => c.status === 'SHIPPED')?._count || 0,
            toBeInvoiced: activityCounts.find(c => c.status === 'PENDING')?._count || 0,
        };

        // 4. Recent Activity
        const recentSales = await prisma.sale.findMany({
            where: { tenantId, isDeleted: false },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                items: { include: { product: true } }
            }
        });

        res.json({
            revenue: totalRevenue._sum.totalAmount || 0,
            procurement: totalProcurement._sum.totalAmount || 0,
            activeOrders: activeOrders,
            lowStock: lowStockCount,
            totalProducts: totalProducts,
            recentActivity: recentSales,
            chartData: chartData,
            activity
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: 'Failed to generate metrics' });
    }
};
