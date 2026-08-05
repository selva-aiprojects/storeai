import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_SLUG = 'prime';

type ProductSeed = {
    sku: string;
    name: string;
    category: string;
    description: string;
    brand: string;
    image: string;
    unit: string;
    costPrice: number;
    price: number;
    gstRate: number;
    lowStockThreshold: number;
    reorderPoint: number;
    reorderQuantity: number;
    leadTimeDays: number;
    isBatchTracked?: boolean;
};

type ReceiptLine = { sku: string; quantity: number; batchNumber: string; expiryDate?: string };
type PurchaseSeed = { orderNumber: string; grnNumber: string; supplierEmail: string; lines: ReceiptLine[] };

const categories = [
    ['Groceries', 'Everyday staples and pantry essentials'],
    ['Beverages', 'Ready-to-drink beverages and refreshment'],
    ['Fresh Produce', 'Fresh fruit and short shelf-life produce'],
    ['Electronics', 'Consumer electronics and accessories'],
    ['Apparel', 'Everyday apparel and seasonal essentials'],
    ['Hardware', 'Tools and home-improvement essentials'],
] as const;

const products: ProductSeed[] = [
    { sku: 'PRS-GRO-001', name: 'Organic Basmati Rice 5kg', category: 'Groceries', description: 'Aged, long-grain basmati rice for everyday cooking.', brand: 'Harvest Gold', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80', unit: 'bag', costPrice: 470, price: 650, gstRate: 5, lowStockThreshold: 18, reorderPoint: 30, reorderQuantity: 80, leadTimeDays: 4, isBatchTracked: true },
    { sku: 'PRS-GRO-002', name: 'Cold-Pressed Groundnut Oil 1L', category: 'Groceries', description: 'Cold-pressed groundnut oil in a sealed one-litre bottle.', brand: 'PureFields', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80', unit: 'bottle', costPrice: 168, price: 245, gstRate: 5, lowStockThreshold: 20, reorderPoint: 36, reorderQuantity: 96, leadTimeDays: 5, isBatchTracked: true },
    { sku: 'PRS-BEV-001', name: 'Sparkling Water Lime 330ml', category: 'Beverages', description: 'Chilled lime sparkling water, single serve.', brand: 'ClearSpring', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&q=80', unit: 'can', costPrice: 31, price: 55, gstRate: 12, lowStockThreshold: 48, reorderPoint: 96, reorderQuantity: 240, leadTimeDays: 3, isBatchTracked: true },
    { sku: 'PRS-BEV-002', name: 'Arabica Cold Brew Coffee 250ml', category: 'Beverages', description: 'Ready-to-drink smooth Arabica cold brew.', brand: 'Brewline', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80', unit: 'bottle', costPrice: 74, price: 135, gstRate: 12, lowStockThreshold: 30, reorderPoint: 60, reorderQuantity: 144, leadTimeDays: 4, isBatchTracked: true },
    { sku: 'PRS-PRO-001', name: 'Alphonso Mangoes 1kg', category: 'Fresh Produce', description: 'Hand-selected Alphonso mangoes, packed by weight.', brand: 'FarmFresh', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80', unit: 'kg', costPrice: 220, price: 350, gstRate: 0, lowStockThreshold: 12, reorderPoint: 24, reorderQuantity: 60, leadTimeDays: 2, isBatchTracked: true },
    { sku: 'PRS-PRO-002', name: 'Avocado Hass 4-Pack', category: 'Fresh Produce', description: 'Ripe-ready Hass avocados, four-count pack.', brand: 'FarmFresh', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80', unit: 'pack', costPrice: 180, price: 299, gstRate: 0, lowStockThreshold: 10, reorderPoint: 20, reorderQuantity: 48, leadTimeDays: 2, isBatchTracked: true },
    { sku: 'PRS-ELE-001', name: 'Wireless Noise-Cancelling Earbuds', category: 'Electronics', description: 'Bluetooth earbuds with active noise cancellation and charging case.', brand: 'SonicWave', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80', unit: 'unit', costPrice: 1650, price: 2499, gstRate: 18, lowStockThreshold: 8, reorderPoint: 15, reorderQuantity: 36, leadTimeDays: 8 },
    { sku: 'PRS-ELE-002', name: 'Portable Bluetooth Speaker', category: 'Electronics', description: 'Water-resistant portable speaker with 12-hour battery.', brand: 'SonicWave', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', unit: 'unit', costPrice: 1190, price: 1899, gstRate: 18, lowStockThreshold: 8, reorderPoint: 15, reorderQuantity: 30, leadTimeDays: 8 },
    { sku: 'PRS-APP-001', name: 'Premium Cotton Polo T-Shirt', category: 'Apparel', description: 'Soft cotton polo with a tailored regular fit.', brand: 'NorthThread', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80', unit: 'piece', costPrice: 490, price: 899, gstRate: 12, lowStockThreshold: 16, reorderPoint: 30, reorderQuantity: 72, leadTimeDays: 10, isBatchTracked: true },
    { sku: 'PRS-APP-002', name: 'Classic Crew Neck T-Shirt', category: 'Apparel', description: 'Everyday combed-cotton crew neck t-shirt.', brand: 'NorthThread', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80', unit: 'piece', costPrice: 285, price: 549, gstRate: 12, lowStockThreshold: 20, reorderPoint: 40, reorderQuantity: 96, leadTimeDays: 10, isBatchTracked: true },
    { sku: 'PRS-HAR-001', name: 'Cordless Drill Tool Pack', category: 'Hardware', description: '18V cordless drill with battery, charger and bit set.', brand: 'ForgePro', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80', unit: 'unit', costPrice: 2450, price: 3899, gstRate: 18, lowStockThreshold: 5, reorderPoint: 10, reorderQuantity: 24, leadTimeDays: 12 },
    { sku: 'PRS-HAR-002', name: 'Precision Screwdriver Set 32pc', category: 'Hardware', description: 'Magnetic precision screwdriver set for household repairs.', brand: 'ForgePro', image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&q=80', unit: 'set', costPrice: 410, price: 749, gstRate: 18, lowStockThreshold: 12, reorderPoint: 24, reorderQuantity: 60, leadTimeDays: 7 },
];

const suppliers = [
    { name: 'GreenBasket Foods Pvt Ltd', email: 'procurement@greenbasket.example', contact: '+91 22 4012 1100', address: 'Navi Mumbai, Maharashtra', gstNumber: '27AABCG1234M1ZV', paymentTerms: 'Net 30' },
    { name: 'Orbit Electronics Distribution', email: 'orders@orbitelectronics.example', contact: '+91 80 4012 2200', address: 'Bengaluru, Karnataka', gstNumber: '29AABCO5678D1ZP', paymentTerms: 'Net 30' },
    { name: 'NorthThread & Forge Supply Co', email: 'trade@norththreadforge.example', contact: '+91 11 4012 3300', address: 'New Delhi, Delhi', gstNumber: '07AABCN9012K1ZQ', paymentTerms: 'Net 45' },
];

const purchases: PurchaseSeed[] = [
    { orderNumber: 'PO-PRIME-2026-0001', grnNumber: 'GRN-PRIME-2026-0001', supplierEmail: 'procurement@greenbasket.example', lines: [
        { sku: 'PRS-GRO-001', quantity: 80, batchNumber: 'RICE-PR-2607', expiryDate: '2027-07-31' },
        { sku: 'PRS-GRO-002', quantity: 96, batchNumber: 'OIL-PR-2607', expiryDate: '2027-04-30' },
        { sku: 'PRS-BEV-001', quantity: 240, batchNumber: 'SPK-PR-2607', expiryDate: '2027-01-31' },
        { sku: 'PRS-BEV-002', quantity: 144, batchNumber: 'CBR-PR-2607', expiryDate: '2026-12-31' },
    ] },
    { orderNumber: 'PO-PRIME-2026-0002', grnNumber: 'GRN-PRIME-2026-0002', supplierEmail: 'orders@orbitelectronics.example', lines: [
        { sku: 'PRS-ELE-001', quantity: 36, batchNumber: 'SWE-PR-2607' },
        { sku: 'PRS-ELE-002', quantity: 30, batchNumber: 'SWS-PR-2607' },
    ] },
    { orderNumber: 'PO-PRIME-2026-0003', grnNumber: 'GRN-PRIME-2026-0003', supplierEmail: 'trade@norththreadforge.example', lines: [
        { sku: 'PRS-APP-001', quantity: 72, batchNumber: 'NTP-PR-2607' },
        { sku: 'PRS-APP-002', quantity: 96, batchNumber: 'NTC-PR-2607' },
        { sku: 'PRS-HAR-001', quantity: 24, batchNumber: 'FDR-PR-2607' },
        { sku: 'PRS-HAR-002', quantity: 60, batchNumber: 'FSD-PR-2607' },
        { sku: 'PRS-PRO-001', quantity: 60, batchNumber: 'MNG-PR-2607', expiryDate: '2026-08-15' },
        { sku: 'PRS-PRO-002', quantity: 48, batchNumber: 'AVO-PR-2607', expiryDate: '2026-08-12' },
    ] },
];

async function main() {
    const tenant = await prisma.tenant.findUnique({ where: { slug: TENANT_SLUG } });
    if (!tenant) throw new Error(`Tenant "${TENANT_SLUG}" was not found.`);

    const warehouse = await prisma.warehouse.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: 'Prime Central Warehouse' } },
        update: { location: 'Mumbai Distribution Centre', isDefault: true },
        create: { tenantId: tenant.id, name: 'Prime Central Warehouse', location: 'Mumbai Distribution Centre', isDefault: true },
    });

    const categoryByName = new Map<string, string>();
    for (const [name, description] of categories) {
        const category = await prisma.category.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name } },
            update: { description },
            create: { tenantId: tenant.id, name, description },
        });
        categoryByName.set(name, category.id);
    }

    const productBySku = new Map<string, { id: string; costPrice: number; gstRate: number }>();
    for (const product of products) {
        const categoryId = categoryByName.get(product.category);
        if (!categoryId) throw new Error(`Missing category for ${product.sku}`);
        const { category: _category, ...productData } = product;
        const record = await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant.id, sku: product.sku } },
            update: { ...productData, categoryId, tenantId: tenant.id },
            create: { ...productData, categoryId, tenantId: tenant.id, stockQuantity: 0 },
            select: { id: true, costPrice: true, gstRate: true },
        });
        productBySku.set(product.sku, record);
    }

    const supplierByEmail = new Map<string, string>();
    for (const supplier of suppliers) {
        const record = await prisma.supplier.upsert({
            where: { tenantId_email: { tenantId: tenant.id, email: supplier.email } },
            update: { ...supplier, status: 'ACTIVE' },
            create: { ...supplier, status: 'ACTIVE', tenantId: tenant.id },
            select: { id: true },
        });
        supplierByEmail.set(supplier.email, record.id);
    }

    for (const purchase of purchases) {
        const supplierId = supplierByEmail.get(purchase.supplierEmail);
        if (!supplierId) throw new Error(`Missing supplier for ${purchase.orderNumber}`);
        const lines = purchase.lines.map(line => {
            const product = productBySku.get(line.sku);
            if (!product) throw new Error(`Missing product for ${line.sku}`);
            return { ...line, product };
        });
        const subtotal = lines.reduce((total, line) => total + line.quantity * line.product.costPrice, 0);
        const taxAmount = lines.reduce((total, line) => total + line.quantity * line.product.costPrice * (line.product.gstRate / 100), 0);

        let order = await prisma.order.findUnique({
            where: { tenantId_orderNumber: { tenantId: tenant.id, orderNumber: purchase.orderNumber } },
            include: { items: true },
        });
        if (!order) {
            order = await prisma.order.create({
                data: {
                    tenantId: tenant.id,
                    supplierId,
                    orderNumber: purchase.orderNumber,
                    status: 'APPROVED',
                    approvalStatus: 'APPROVED',
                    totalAmount: subtotal + taxAmount,
                    taxAmount,
                    expectedDeliveryDate: new Date('2026-07-25T00:00:00.000Z'),
                    items: { create: lines.map(line => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.product.costPrice })) },
                },
                include: { items: true },
            });
        }

        const existingReceipt = await prisma.goodsReceipt.findFirst({ where: { orderId: order.id, grnNumber: purchase.grnNumber } });
        if (existingReceipt) {
            console.log(`Skipped ${purchase.grnNumber}: receipt already exists.`);
            continue;
        }

        await prisma.$transaction(async tx => {
            const grn = await tx.goodsReceipt.create({
                data: {
                    grnNumber: purchase.grnNumber,
                    orderId: order!.id,
                    warehouseId: warehouse.id,
                    notes: `Seeded compliant receipt against ${purchase.orderNumber}`,
                    items: { create: lines.map(line => ({ productId: line.product.id, quantity: line.quantity, batchNumber: line.batchNumber, expiryDate: line.expiryDate ? new Date(line.expiryDate) : null })) },
                },
            });

            for (const line of lines) {
                const orderItem = order!.items.find(item => item.productId === line.product.id);
                if (!orderItem) throw new Error(`PO line missing for ${line.sku}`);

                const batch = await tx.productBatch.create({
                    data: {
                        productId: line.product.id,
                        batchNumber: line.batchNumber,
                        poId: order!.id,
                        quantityReceived: line.quantity,
                        quantityAvailable: line.quantity,
                        costPrice: line.product.costPrice,
                        expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
                        warehouseLocation: warehouse.location,
                        status: 'ACTIVE',
                    },
                });
                await tx.stock.upsert({
                    where: { warehouseId_productId_batchNumber: { warehouseId: warehouse.id, productId: line.product.id, batchNumber: line.batchNumber } },
                    update: { quantity: { increment: line.quantity } },
                    create: { warehouseId: warehouse.id, productId: line.product.id, batchNumber: line.batchNumber, quantity: line.quantity, expiryDate: line.expiryDate ? new Date(line.expiryDate) : null },
                });
                const updatedProduct = await tx.product.update({
                    where: { id: line.product.id },
                    data: { stockQuantity: { increment: line.quantity } },
                    select: { stockQuantity: true },
                });
                await tx.orderItem.update({ where: { id: orderItem.id }, data: { receivedQuantity: { increment: line.quantity } } });
                await tx.stockLedger.create({
                    data: {
                        tenantId: tenant.id,
                        productId: line.product.id,
                        batchId: batch.id,
                        transactionType: 'INWARD',
                        referenceType: 'GRN',
                        referenceId: grn.id,
                        quantityIn: line.quantity,
                        quantityOut: 0,
                        balanceQuantity: updatedProduct.stockQuantity,
                        remarks: `Received on ${purchase.grnNumber} against ${purchase.orderNumber}`,
                        createdBy: 'SYSTEM_SEED',
                    },
                });
            }
            await tx.order.update({ where: { id: order!.id }, data: { status: 'COMPLETED', approvalStatus: 'APPROVED' } });
        }, { maxWait: 10_000, timeout: 30_000 });
        console.log(`Created ${purchase.orderNumber} and ${purchase.grnNumber}.`);
    }

    console.log(`Seed complete for ${tenant.name}: ${products.length} products, ${purchases.length} approved POs, and ${purchases.length} GRNs.`);
}

main()
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
