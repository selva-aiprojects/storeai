import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 STARTING COGNIVECTRA ASSET SEED...");

    // 1. Get Tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) throw new Error("No tenant found!");

    // 2. Create/Find Supplier "Cognivectra"
    const supplier = await prisma.supplier.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'info@cognivectra.com' } },
        update: {},
        create: {
            name: "Cognivectra Solutions",
            email: "info@cognivectra.com",
            contact: "+1-555-0100",
            status: "ACTIVE",
            tenantId: tenant.id
        }
    });
    console.log(`✅ Supplier: ${supplier.name}`);

    // 3. Create Product "Cognivectra Logo Asset"
    // Fetch a category first
    let category = await prisma.category.findFirst({ where: { tenantId: tenant.id } });
    if (!category) {
        category = await prisma.category.create({
            data: { name: "Branding Assets", tenantId: tenant.id }
        });
    }

    const product = await prisma.product.upsert({
        where: { tenantId_sku: { tenantId: tenant.id, sku: "COG-LOGO-001" } },
        update: {},
        create: {
            name: "Cognivectra Brand Logo",
            sku: "COG-LOGO-001",
            price: 500.00,
            costPrice: 0.00,
            stockQuantity: 1,
            unit: "digital",
            lowStockThreshold: 1,
            description: "Official small logo asset for Cognivectra branding.",
            categoryId: category.id,
            tenantId: tenant.id
        }
    });
    console.log(`✅ Product: ${product.name} (SKU: ${product.sku})`);

    // 4. Update Tenant Logo just in case (optional, but requested contextually)
    await prisma.tenant.update({
        where: { id: tenant.id },
        data: { logo: '/logo-final.png' } // Ensure it points to the file we moved
    });
    console.log(`✅ Tenant Logo Updated`);

}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
