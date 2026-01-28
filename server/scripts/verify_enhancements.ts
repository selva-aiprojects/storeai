import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEnhancements() {
    console.log("--- Starting Senior Tester Integration Check ---");

    try {
        // 1. Check Product Master Fields
        console.log("Checking Product Master Fields...");
        const testProduct = await prisma.product.findFirst({
            where: { isDeleted: false }
        });

        if (testProduct) {
            console.log(`Product found: ${testProduct.name}`);
            console.log(`- GST Rate: ${testProduct.gstRate}`);
            console.log(`- Other Tax Rate: ${testProduct.otherTaxRate}`);
            console.log(`- Transportation Cost: ${testProduct.transportationCost}`);

            if (testProduct.gstRate === undefined || testProduct.otherTaxRate === undefined) {
                console.error("CRITICAL: New tax fields are missing in the fetched product object!");
            }
        } else {
            console.warn("No products found to test.");
        }

        // 2. Check Sales Integration (Taxes)
        console.log("\nChecking Sales & Taxation Logic...");
        const recentSale = await prisma.sale.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });

        if (recentSale) {
            console.log(`Recent Sale: ${recentSale.invoiceNo}`);
            console.log(`- Total Amount: ${recentSale.totalAmount}`);
            console.log(`- Tax Amount: ${recentSale.taxAmount}`);

            const itemTaxes = recentSale.items.reduce((acc, item) => acc + (item.taxAmount || 0), 0);
            console.log(`- Sum of Item Taxes: ${itemTaxes}`);

            if (Math.abs(itemTaxes - recentSale.taxAmount) > 0.01) {
                console.error("DISCREPANCY: Sale total tax does not match sum of item taxes!");
            } else {
                console.log("SUCCESS: Taxation logic verified.");
            }
        }

        // 3. Check Financial Reporting Logic Compatibility
        console.log("\nChecking Financial Reporting Data Access...");
        const tenant = await prisma.tenant.findFirst();
        if (tenant) {
            const tenantId = tenant.id;
            const currentYear = new Date().getFullYear();
            const startDate = new Date(currentYear, 0, 1);
            const endDate = new Date(currentYear, 11, 31);

            const salesCount = await prisma.sale.count({ where: { tenantId, createdAt: { gte: startDate, lte: endDate } } });
            const purchaseCount = await prisma.order.count({ where: { tenantId, createdAt: { gte: startDate, lte: endDate }, status: { in: ['COMPLETED', 'PARTIAL_RECEIVED', 'APPROVED', 'SHIPPED'] } } });

            console.log(`Reporting Stats for Tenant ${tenant.name}:`);
            console.log(`- Sales Records: ${salesCount}`);
            console.log(`- Purchase Records: ${purchaseCount}`);
        }

        console.log("\n--- Integration Check Complete ---");

    } catch (error) {
        console.error("FATAL ERROR during testing:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testEnhancements();
