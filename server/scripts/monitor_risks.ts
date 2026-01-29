
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Risk Analysis...');

    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    // 1. Inventory Risks (Stock <= ReorderPoint)
    const lowStockItems = await prisma.product.findMany({
        where: {
            stockQuantity: { lte: prisma.product.fields.reorderPoint },
            isDeleted: false
        },
        include: { tenant: true, category: true },
        orderBy: { stockQuantity: 'asc' },
        take: 10
    });

    // 2. Expiry Risks (Expiry Date <= 7 Days)
    const expiringBatches = await prisma.productBatch.findMany({
        where: {
            expiryDate: { lte: next7Days, gte: today },
            quantityAvailable: { gt: 0 }
        },
        include: { product: { include: { tenant: true } } },
        orderBy: { expiryDate: 'asc' },
        take: 10
    });

    // 3. Financial Risks (Pending AR)
    // Simple check: High value invoices pending > 30 days? 
    // For now, just list highest pending sales
    const pendingInvoices = await prisma.sale.findMany({
        where: { status: 'PENDING' },
        orderBy: { totalAmount: 'desc' },
        take: 5,
        include: { tenant: true, customer: true }
    });

    // Generate Report
    let reportContent = `# 🚨 Executive Risk Report (Next 7 Days)\n\n`;
    reportContent += `**Generated On:** ${today.toISOString()}\n\n`;

    reportContent += `## 1. Top 3 Inventory Risks (Immediate Stock-out)\n`;
    if (lowStockItems.length > 0) {
        lowStockItems.slice(0, 3).forEach((item, idx) => {
            reportContent += `${idx + 1}. **${item.name}** (${item.tenant.name})\n`;
            reportContent += `   - Current Stock: **${item.stockQuantity} ${item.unit}** (Reorder Point: ${item.reorderPoint})\n`;
            reportContent += `   - Risk: Sales stoppage within 24 hours.\n`;
        });
    } else {
        reportContent += `✅ No immediate stock-out risks detected.\n`;
    }
    reportContent += `\n`;

    reportContent += `## 2. Top 3 Expiry Risks (Loss of Inventory)\n`;
    if (expiringBatches.length > 0) {
        expiringBatches.slice(0, 3).forEach((batch, idx) => {
            reportContent += `${idx + 1}. **${batch.product.name}** (${batch.product.tenant.name})\n`;
            reportContent += `   - Batch: \`${batch.batchNumber}\`\n`;
            reportContent += `   - Expires: **${batch.expiryDate?.toISOString().split('T')[0]}**\n`;
            reportContent += `   - Value at Risk: **${batch.quantityAvailable} units** (Cost: $${(batch.costPrice * batch.quantityAvailable).toFixed(2)})\n`;
        });
    } else {
        reportContent += `✅ No batches expiring in the next 7 days.\n`;
    }
    reportContent += `\n`;

    reportContent += `## 3. Financial / Operational Alerts\n`;
    // Placeholder financial logic since we just seeded success cases mainly
    if (pendingInvoices.length > 0) {
        reportContent += `> [!WARNING]\n> High value invoices pending payment:\n`;
        pendingInvoices.slice(0, 2).forEach(inv => {
            reportContent += `> - ${inv.customer?.name}: **$${inv.totalAmount.toFixed(2)}** (Inv: ${inv.invoiceNo})\n`;
        });
    } else {
        reportContent += `> [!TIP]\n> Cash flow looking steady. No major pending invoices triggered alerts.\n`;
    }

    // Write to file
    // Ideally write to Artifacts dir, but script runs in server.
    // We will print to console and also write adjacent for easy view
    console.log(reportContent);
    const outputPath = path.join(__dirname, '../../REPORT_TODAY.md');
    fs.writeFileSync(outputPath, reportContent);
    console.log(`✅ Report saved to ${outputPath}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
