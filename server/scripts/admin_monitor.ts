
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🛡️ Starting Admin Agent (System Health)...');

    // --- 1. CROSS-TENANT ANALYSIS (Scorecard) ---
    console.log('📊 Analyzing Tenant Usage...');
    const tenants = await prisma.tenant.findMany({
        include: { _count: { select: { users: true, products: true, orders: true, sales: true } } }
    });

    let scorecard = `# 🏥 Tenant Health Scorecard\n**Generated On:** ${new Date().toISOString()}\n\n`;
    scorecard += `| Tenant | Users | Products | Orders | Sales | Health Score | Status |\n`;
    scorecard += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    for (const t of tenants) {
        // Safe access to counts
        const userCount = t._count?.users || 0;
        const prodCount = t._count?.products || 0;
        const orderCount = t._count?.orders || 0;
        const salesCount = t._count?.sales || 0;

        // Simple Health Score Logic (0-100)
        let score = 0;
        if (userCount > 0) score += 20;
        if (prodCount > 5) score += 20;
        if (salesCount > 10) score += 30;
        if (orderCount > 5) score += 30;

        const status = score >= 80 ? '🟢 Healthy' : (score >= 50 ? '🟡 Warning' : '🔴 Critical');

        scorecard += `| **${t.name}** | ${userCount} | ${prodCount} | ${orderCount} | ${salesCount} | **${score}/100** | ${status} |\n`;
    }

    const scorecardPath = path.join(__dirname, '../../TENANT_HEALTH_SCORECARD.md');
    fs.writeFileSync(scorecardPath, scorecard);
    console.log(`✅ Scorecard generated: ${scorecardPath}`);


    // --- 2. DATA QUALITY & INTEGRITY (System Health) ---
    console.log('🧹 Checking Data Integrity...');
    let sysReport = `# 🛠️ System Health & Integrity Report\n**Run Date:** ${new Date().toISOString()}\n\n`;

    let issueCount = 0;
    sysReport += `## 🚨 Orphan / Anomaly Detection\n\n`;

    // 2.1 Orphan Stock (Stock without valid Product?)
    const ghostStock = await prisma.product.count({
        where: { isDeleted: true, stockQuantity: { gt: 0 } }
    });

    if (ghostStock > 0) {
        sysReport += `- 🔴 **Ghost Stock Detected**: ${ghostStock} deleted products still have physical stock.\n`;
        issueCount++;
    } else {
        sysReport += `- 🟢 No Ghost Stock (Deleted products with stock).\n`;
    }

    // 2.2 Uncategorized Products - REMOVED (Schema enforces categoryId string)

    // 2.3 Pricing Anomalies (Cost > Price)
    const lossProducts = await prisma.product.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true, price: true, costPrice: true, tenant: { select: { name: true } } }
    });

    const invertedPricing = lossProducts.filter(p => (p.costPrice || 0) > (p.price || 0));
    if (invertedPricing.length > 0) {
        sysReport += `- 🟡 **Negative Margin Pricing**: ${invertedPricing.length} products priced below cost.\n`;
        invertedPricing.slice(0, 5).forEach(p => {
            const tName = p.tenant?.name || 'Unknown';
            sysReport += `  - ${p.name} (${tName}): Cost $${p.costPrice} > Price $${p.price}\n`;
        });
        issueCount++;
    } else {
        sysReport += `- 🟢 No Negative Margin Products detected.\n`;
    }

    // 2.4 Orphan Sales 
    const emptySales = await prisma.sale.count({
        where: { totalAmount: 0, status: 'COMPLETED' }
    });
    if (emptySales > 0) {
        sysReport += `- 🔴 **Zero-Value Transactions**: ${emptySales} completed sales have $0 value.\n`;
        issueCount++;
    }

    // 2.5 New Tenant Onboarding Status
    sysReport += `\n## 🆕 Onboarding Validation\n`;
    const recentTenants = await prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { _count: { select: { products: true } } }
    });

    for (const t of recentTenants) {
        const prodCount = t._count?.products || 0;
        const isSetup = prodCount > 0;
        sysReport += `- **${t.name}**: ${isSetup ? '✅ Setup Complete' : '⏳ Pending Inventory Seed'}\n`;
    }

    if (issueCount === 0) {
        sysReport += `\n### ✅ SYSTEM STATUS: HEALTHY\nNo critical anomalies found.`;
    } else {
        sysReport += `\n### ⚠️ SYSTEM STATUS: ATTENTION NEEDED\nFound ${issueCount} issues requiring review.`;
    }

    const sysReportPath = path.join(__dirname, '../../SYSTEM_HEALTH_REPORT.md');
    fs.writeFileSync(sysReportPath, sysReport);
    console.log(`✅ System Report generated: ${sysReportPath}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
