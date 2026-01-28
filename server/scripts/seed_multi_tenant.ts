
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TENANTS = [
    {
        name: 'Nexus Retail Group',
        slug: 'nexus-retail',
        type: 'RETAIL',
        products: [
            // Electronics
            { name: 'Smart Watch Series 7', sku: 'NEX-WATCH-001', price: 399, cat: 'Electronics' },
            { name: 'Noise Cancel Headphones', sku: 'NEX-AUDIO-002', price: 299, cat: 'Electronics' },
            { name: 'Tablet Pro 12', sku: 'NEX-TAB-003', price: 899, cat: 'Electronics' },
            { name: '4K Gaming Monitor', sku: 'NEX-MON-004', price: 450, cat: 'Electronics' },
            { name: 'Wireless Ergonomic Mouse', sku: 'NEX-MOUSE-005', price: 59, cat: 'Electronics' },
            // Fashion
            { name: 'Denim Jacket (Vintage)', sku: 'NEX-FASH-001', price: 79, cat: 'Fashion' },
            { name: 'Running Shoes Pro', sku: 'NEX-SHOE-002', price: 120, cat: 'Fashion' },
            { name: 'Cotton Crew Tee', sku: 'NEX-TEE-003', price: 25, cat: 'Fashion' },
            // Home
            { name: 'Smart LED Bulb (RGB)', sku: 'NEX-HOME-001', price: 15, cat: 'Home & Living' },
            { name: 'Robot Vacuum Cleaner', sku: 'NEX-VAC-002', price: 350, cat: 'Home & Living' }
        ]
    },
    {
        name: 'Apex Logistics Solutions',
        slug: 'apex-logistics',
        type: 'LOGISTICS',
        products: [
            // Packaging
            { name: 'Corrugated Box (Large)', sku: 'APX-BOX-L', price: 5, cat: 'Packaging' },
            { name: 'Corrugated Box (Small)', sku: 'APX-BOX-S', price: 2, cat: 'Packaging' },
            { name: 'Shipping Tape (Industrial)', sku: 'APX-TAPE-01', price: 12, cat: 'Packaging' },
            { name: 'Pallet Wrap (Heavy)', sku: 'APX-WRAP-009', price: 45, cat: 'Packaging' },
            { name: 'Biodegradable Packing Peanuts', sku: 'APX-FILL-001', price: 25, cat: 'Packaging' },
            // Safety
            { name: 'High-Vis Safety Vest', sku: 'APX-VEST-001', price: 15, cat: 'Safety Gear' },
            { name: 'Steel Toe Boots', sku: 'APX-BOOT-002', price: 85, cat: 'Safety Gear' },
            { name: 'Industrial Hard Hat', sku: 'APX-HELM-003', price: 30, cat: 'Safety Gear' },
            // Fleet 
            { name: 'Diesel Exhaust Fluid (DEF)', sku: 'APX-FL-DEF', price: 20, cat: 'Fleet Maintenance' },
            { name: 'Heavy Duty Truck Tire', sku: 'APX-TIRE-22', price: 450, cat: 'Fleet Maintenance' }
        ]
    },
    {
        name: 'Zenith Healthcare',
        slug: 'zenith-health',
        type: 'HEALTH',
        products: [
            // Medical Supplies
            { name: 'Surgical Mask (Box of 50)', sku: 'ZEN-MASK-50', price: 15, cat: 'Medical Supplies' },
            { name: 'N95 Respirator (Box of 20)', sku: 'ZEN-N95-20', price: 45, cat: 'Medical Supplies' },
            { name: 'Nitrile Exam Gloves (100)', sku: 'ZEN-GLOV-M', price: 20, cat: 'Medical Supplies' },
            { name: 'Sterile Syringes (Needle)', sku: 'ZEN-SYR-001', price: 30, cat: 'Medical Supplies' },
            // Pharma
            { name: 'Ibuprofen 400mg (100s)', sku: 'ZEN-PH-IBU', price: 12, cat: 'Pharmaceuticals' },
            { name: 'Amoxicillin 500mg', sku: 'ZEN-PH-AMX', price: 18, cat: 'Pharmaceuticals' },
            { name: 'Cough Syrup (Menthol)', sku: 'ZEN-PH-CGH', price: 8, cat: 'Pharmaceuticals' },
            // Diagnostics
            { name: 'Digital Thermometer', sku: 'ZEN-DIA-THR', price: 25, cat: 'Diagnostics' },
            { name: 'Blood Pressure Monitor', sku: 'ZEN-DIA-BPM', price: 65, cat: 'Diagnostics' },
            { name: 'Pulse Oximeter', sku: 'ZEN-DIA-PUL', price: 35, cat: 'Diagnostics' }
        ]
    }
];

async function seedMultiTenant() {
    console.log('🚀 Starting Multi-Tenant Expansion...');
    const password = await bcrypt.hash('DemoPass123!', 10);

    // 1. Ensure Super Admin Exists
    const adminEmail = 'admin@storeai.com';
    let admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            role: 'SUPER_ADMIN',
            firstName: 'Super',
            lastName: 'Admin',
            password
        }
    });
    console.log(`👨‍✈️ Super Admin Secured: ${admin.email}`);

    // 2. Loop Tenants
    for (const t of TENANTS) {
        console.log(`\n🏢 Provisioning Tenant: ${t.name}...`);
        try {
            // A. Create Tenant
            const tenant = await prisma.tenant.upsert({
                where: { slug: t.slug },
                update: {},
                create: {
                    name: t.name,
                    slug: t.slug,
                    status: 'ACTIVE',
                    features: { inventory: true, sales: true, hr: true, procurement: true }
                }
            });

            // B. Link Super Admin
            const link = await prisma.userTenant.findUnique({
                where: { userId_tenantId: { userId: admin.id, tenantId: tenant.id } }
            });

            if (!link) {
                // Find or Create Global Role
                // Schema shows Role has NO tenantId, it is global.
                let role = await prisma.role.findUnique({ where: { code: 'ADMIN' } });

                if (!role) {
                    // Try finding by name or create
                    role = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
                    if (!role) {
                        role = await prisma.role.create({
                            data: {
                                name: 'ADMIN',
                                code: 'ADMIN',
                                // permissions relation exists, skipping complex seed
                            }
                        });
                    }
                }

                await prisma.userTenant.create({
                    data: {
                        userId: admin.id,
                        tenantId: tenant.id,
                        roleId: role.id,
                        isActive: true
                    }
                });
                console.log(`   🔗 Linked Super Admin to ${t.slug}`);
            }

            // C. Seed Categories & Products
            for (const p of t.products) {
                const cat = await prisma.category.upsert({
                    where: { tenantId_name: { tenantId: tenant.id, name: p.cat } },
                    update: {},
                    create: { name: p.cat, tenantId: tenant.id }
                });

                await prisma.product.upsert({
                    where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
                    update: {},
                    create: {
                        name: p.name,
                        sku: p.sku,
                        categoryId: cat.id,
                        tenantId: tenant.id,
                        price: p.price,
                        costPrice: p.price * 0.7,
                        stockQuantity: 100
                    }
                });
            }
            console.log(`   📦 Inventory Seeded (${t.products.length} SKUs)`);

            // D. Create Department & Employee (for HR view)
            // Department has no 'code' field
            const dept = await prisma.department.upsert({
                where: { tenantId_name: { tenantId: tenant.id, name: 'Operations' } },
                update: {},
                create: { name: 'Operations', tenantId: tenant.id }
            });

            // Employee
            const empId = `EMP-${t.slug.substring(0, 3).toUpperCase()}-001`;
            const existingEmp = await prisma.employee.findUnique({ where: { employeeId: empId } });

            if (!existingEmp) {
                await prisma.employee.create({
                    data: {
                        firstName: 'Manager',
                        lastName: t.slug.split('-')[1] || 'Agent',
                        employeeId: empId,
                        designation: 'General Manager',
                        joiningDate: new Date(),
                        salary: 60000,
                        departmentId: dept.id,
                        status: 'ACTIVE'
                    }
                });
                console.log(`   👥 HR Setup Complete`);
            }
        } catch (e: any) {
            console.error(`❌ Failed ${t.name}: ${e.message}`);
        }
    }

    console.log('\n✅ Multi-Tenant Expansion Complete!');
    console.log('👉 Login as admin@storeai.com and switch tenants using the Profile menu or top bar.');
}

seedMultiTenant()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => await prisma.$disconnect());
