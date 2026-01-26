import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Core Summary Stats
        const [totalRevenue, activeOrders, totalProducts, products] = await Promise.all([
            prisma.sale.aggregate({ _sum: { totalAmount: true } }),
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.product.count(),
            prisma.product.findMany({ select: { stockQuantity: true, lowStockThreshold: true } })
        ]);

        // Manually calculate low stock count for SQLite compatibility
        const lowStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;

        // 2. Chart Data: Monthly Revenue (Last 6 months)
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);

            const monthRevenue = await prisma.sale.aggregate({
                where: {
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
