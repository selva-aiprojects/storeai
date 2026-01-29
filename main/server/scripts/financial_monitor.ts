
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('📈 Starting Optimized Financial Analysis Agent...');

    // --- PRE-FETCH DATA (Optimization) ---
    console.log('🔄 Loading Products & Costs into Memory...');
    const allProducts = await prisma.product.findMany({
        include: { category: true }
    });

    // Create Cost Map: ProductID -> { cost, price, name, categoryName }
    const productMap = new Map();
    allProducts.forEach(p => {
        productMap.set(p.id, {
            cost: p.costPrice || 0,
            price: p.price || 0,
            name: p.name,
            category: p.category?.name || 'Uncategorized',
            stock: p.stockQuantity,
            id: p.id
        });
    });

    // --- 1. GLOBAL PROFIT SUMMARY ---
    let profitReport = `# 💰 Financial Profit Summary\n**Generated On:** ${new Date().toISOString()}\n\n`;
    profitReport += `## 📅 Monthly Performance (Last 12 Months)\n\n`;
    profitReport += `| Month | Revenue ($) | COGS ($) | Gross Profit ($) | Margin (%) |\n`;
    profitReport += `| :--- | :---: | :---: | :---: | :---: |\n`;

    const months = [];
    for (let i = 0; i < 12; i++) {
        months.push(subMonths(new Date(), i));
    }
    months.reverse();

    for (const date of months) {
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        const monthLabel = format(date, 'MMM yyyy');

        // Fetch Sales for Month
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                status: 'COMPLETED'
            },
            include: { items: true }
        });

        let revenue = 0;
        let cogs = 0;

        for (const sale of sales) {
            revenue += sale.totalAmount;
            for (const item of sale.items) {
                const pDetails = productMap.get(item.productId);
                if (pDetails) {
                    cogs += (pDetails.cost * item.quantity);
                }
            }
        }

        const profit = revenue - cogs;
        const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

        profitReport += `| ${monthLabel} | $${revenue.toFixed(2)} | $${cogs.toFixed(2)} | **$${profit.toFixed(2)}** | ${margin}% |\n`;
    }

    // --- 2. CATEGORY-WISE ANALYSIS (Optimized) ---
    profitReport += `\n## 🏷️ Category Profitability (All Time)\n\n`;
    profitReport += `| Category | Revenue | Profit | Status |\n`;
    profitReport += `| :--- | :---: | :---: | :---: |\n`;

    // Group sales items by Category via ProductMap
    const categoryStats: Record<string, { rev: number, cost: number }> = {};

    // We need all sales items ever? Or just assume from stats above? 
    // Let's do a bulk aggregate or iterate all sales (might be heavy if millions, but ok for 5k)
    const allSalesItems = await prisma.saleItem.findMany({
        where: { sale: { status: 'COMPLETED' } }
    });

    for (const item of allSalesItems) {
        const p = productMap.get(item.productId);
        if (!p) continue;

        if (!categoryStats[p.category]) categoryStats[p.category] = { rev: 0, cost: 0 };
        categoryStats[p.category].rev += (item.unitPrice * item.quantity);
        categoryStats[p.category].cost += (p.cost * item.quantity);
    }

    Object.keys(categoryStats).forEach(cat => {
        const stats = categoryStats[cat];
        const profit = stats.rev - stats.cost;
        const status = profit > 5000 ? '🟢 Star' : (profit > 0 ? '🟡 Maintain' : '🔴 Review');
        profitReport += `| ${cat} | $${stats.rev.toFixed(0)} | $${profit.toFixed(0)} | ${status} |\n`;
    });

    const profitPath = path.join(__dirname, '../../PROFIT_SUMMARY.md');
    fs.writeFileSync(profitPath, profitReport);
    console.log(`✅ Profit Summary generated: ${profitPath}`);


    // --- 3. MARKDOWN STRATEGY (Non-Moving & Slow Moving) ---
    console.log('📉 Calculating Markdown Strategy...');
    let markdownReport = `# 🏷️ Markdown Strategy Draft\n**Generated On:** ${new Date().toISOString()}\n\n`;

    // We need sales per product in last X days
    const ninetyDaysAgo = subDays(new Date(), 90);
    const recentSales = await prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        where: {
            sale: { createdAt: { gte: ninetyDaysAgo } }
        }
    });

    const salesMap = new Map();
    recentSales.forEach(s => salesMap.set(s.productId, s._sum.quantity || 0));

    markdownReport += `## 🧊 Non-Moving Inventory (Zero Sales in 90 Days)\n`;
    markdownReport += `*Target: Unlock trapped capital.*\n\n`;
    markdownReport += `| Product | Category | Stock | Cost Value | Suggested Offer |\n`;
    markdownReport += `| :--- | :--- | :---: | :---: | :---: |\n`;

    let nonMovingCount = 0;
    let slowMovingReport = `\n## 🐢 Slow-Moving Inventory (Low Velocity)\n`;
    slowMovingReport += `| Product | Stock | 90d Sales | Margin Risk | Suggested Offer |\n`;
    slowMovingReport += `| :--- | :---: | :---: | :---: | :---: |\n`;

    for (const p of allProducts) {
        if (p.stockQuantity <= 0) continue; // Ignore out of stock

        const soldQty = salesMap.get(p.id) || 0;
        const valueAtRisk = p.stockQuantity * p.costPrice;

        if (soldQty === 0 && p.stockQuantity > 10) {
            // NON-MOVING
            nonMovingCount++;
            markdownReport += `| **${p.name}** | ${p.category?.name} | ${p.stockQuantity} | $${valueAtRisk.toFixed(0)} | 🔴 **Flat 30% OFF** |\n`;
        } else if (soldQty < 10 && p.stockQuantity > 50) {
            // SLOW MOVING
            slowMovingReport += `| ${p.name} | ${p.stockQuantity} | ${soldQty} | High | 🟡 Buy 2 Get 1 |\n`;
        }
    }

    if (nonMovingCount === 0) markdownReport += `*No significant non-moving inventory found.*\n`;

    markdownReport += slowMovingReport;

    const markdownPath = path.join(__dirname, '../../MARKDOWN_STRATEGY.md');
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(`✅ Markdown Strategy generated: ${markdownPath}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
