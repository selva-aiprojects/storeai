
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🤖 Starting Inventory Health Monitor Agent...');
    const today = new Date();
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    let reportContent = `# 🛡️ Inventory Health & Action Report\n**Run Date:** ${today.toISOString()}\n\n`;

    // --- 1. LOW STOCK ANALYSIS & ACTION ---
    const lowStockItems = await prisma.product.findMany({
        where: {
            stockQuantity: { lte: prisma.product.fields.reorderPoint },
            isDeleted: false
        },
        include: { tenant: true, category: true, supplierAgreements: { include: { supplier: true } } }
    });

    reportContent += `## 📦 Low Stock Actions\n`;

    if (lowStockItems.length > 0) {
        console.log(`📉 Found ${lowStockItems.length} items below reorder point.`);

        for (const item of lowStockItems) {
            // Find preferred supplier (simplistic: first agreement or random from tenant's list?)
            // Better: Get tenant's first supplier if no agreement
            let supplierId = item.supplierAgreements?.[0]?.supplierId || '';
            let supplierName = item.supplierAgreements?.[0]?.supplier.name || '';

            if (!supplierId) {
                const genericSupplier = await prisma.supplier.findFirst({ where: { tenantId: item.tenantId } });
                supplierId = genericSupplier?.id || '';
                supplierName = genericSupplier?.name || '';
            }

            if (supplierId) {
                const qtyToOrder = item.reorderQuantity || 50;
                const poNumber = `AUTO-PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                // CREATE DRAFT PO
                const po = await prisma.order.create({
                    data: {
                        orderNumber: poNumber,
                        status: 'DRAFT',
                        approvalStatus: 'PENDING',
                        totalAmount: qtyToOrder * item.costPrice,
                        supplierId: supplierId,
                        tenantId: item.tenantId,
                        items: {
                            create: {
                                productId: item.id,
                                quantity: qtyToOrder,
                                unitPrice: item.costPrice
                            }
                        }
                    }
                });

                reportContent += `- **${item.name}** (Stock: ${item.stockQuantity})\n`;
                reportContent += `  - 🟢 **Action Taken:** Drafted PO \`${poNumber}\`\n`;
                reportContent += `  - Supplier: ${supplierName}\n`;
                reportContent += `  - Qty: ${qtyToOrder} | Est. Cost: $${(qtyToOrder * item.costPrice).toFixed(2)}\n\n`;
                console.log(`   + Drafted PO ${poNumber} for ${item.name}`);
            } else {
                reportContent += `- **${item.name}** (Stock: ${item.stockQuantity})\n`;
                reportContent += `  - 🔴 **Action Failed:** No Supplier found.\n\n`;
            }
        }
    } else {
        reportContent += `✅ Stock levels healthy. No automated actions needed.\n\n`;
    }

    // --- 2. EXPIRY MONITORING ---
    const expiringBatches = await prisma.productBatch.findMany({
        where: {
            expiryDate: { lte: next7Days, gte: today },
            quantityAvailable: { gt: 0 }
        },
        include: { product: { include: { tenant: true } } }
    });

    reportContent += `## ⏳ Expiry Alerts (Next 7 Days)\n`;
    if (expiringBatches.length > 0) {
        for (const batch of expiringBatches) {
            reportContent += `- **${batch.product.name}** (Batch: \`${batch.batchNumber}\`)\n`;
            reportContent += `  - Expires: ${batch.expiryDate?.toISOString().split('T')[0]}\n`;
            reportContent += `  - Qty at Risk: ${batch.quantityAvailable}\n`;
        }
    } else {
        reportContent += `✅ No immediate expiry risks.\n`;
    }

    // Save Report
    const outputPath = path.join(__dirname, '../../INVENTORY_HEALTH_REPORT.md');
    fs.writeFileSync(outputPath, reportContent);
    console.log(`📝 Report generated: ${outputPath}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
