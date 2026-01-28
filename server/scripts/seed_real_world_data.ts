
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Real-World Data Seeding...');

    // 1. Get or Create Roles
    let superAdminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
        superAdminRole = await prisma.role.create({
            data: {
                name: 'Super Admin',
                code: 'SUPER_ADMIN',
            }
        });
        console.log('✅ Created Super Admin Role');
    }

    let adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                code: 'ADMIN',
            }
        });
        console.log('✅ Created Admin Role');
    }

    // 2. Get or Create Super Admin User
    const commonPassword = await bcrypt.hash('AdminPassword123!', 10);
    const superAdminEmail = 'superadmin@storeai.com';
    let superAdminUser = await prisma.user.findUnique({ where: { email: superAdminEmail } });
    if (!superAdminUser) {
        superAdminUser = await prisma.user.create({
            data: {
                email: superAdminEmail,
                password: commonPassword,
                firstName: 'Super',
                lastName: 'Admin',
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ Created Super Admin User');
    }

    // Also ensure the old admin@storeai.com exists with the same password
    const oldAdminEmail = 'admin@storeai.com';
    await prisma.user.upsert({
        where: { email: oldAdminEmail },
        update: { password: commonPassword, role: 'SUPER_ADMIN' },
        create: {
            email: oldAdminEmail,
            password: commonPassword,
            firstName: 'Alex',
            lastName: 'Master',
            role: 'SUPER_ADMIN'
        }
    });
    console.log(`✅ Verified ${oldAdminEmail} access`);

    // 3. Define Tenants
    const tenantsData = [
        {
            name: 'GastroGlore Fine Foods',
            slug: 'gastroglore',
            logo: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: 'Gourmet Oils', description: 'Premium extra virgin and infused oils' },
                { name: 'Artisan Coffee', description: 'Single-origin and specialty blends' },
                { name: 'Premium Dairy', description: 'Aged cheeses and organic dairy products' },
                { name: 'Sea Salt & Spices', description: 'Hand-harvested salts and exotic spices' }
            ],
            products: [
                { sku: 'GGG-OIL-001', name: 'Extra Virgin Olive Oil (500ml)', price: 24.99, cost: 12.50, brand: 'Estate Reserve', unit: 'bottle' },
                { sku: 'GGG-SALT-002', name: 'Himalayan Pink Salt (1kg)', price: 9.99, cost: 3.20, brand: 'PurePeak', unit: 'bag' },
                { sku: 'GGG-COF-003', name: 'Whole Bean Arabica (1kg)', price: 34.50, cost: 18.00, brand: 'Highland Roasters', unit: 'bag' },
                { sku: 'GGG-VIN-004', name: 'Aged Balsamic Vinegar (250ml)', price: 18.00, cost: 7.50, brand: 'Modena Gold', unit: 'bottle' },
                { sku: 'GGG-SYR-005', name: 'Organic Maple Syrup (500ml)', price: 15.99, cost: 6.80, brand: 'Vermont Pure', unit: 'bottle' }
            ],
            suppliers: [
                { name: 'Global Gourmet Importers', email: 'orders@globalgourmet.com', contact: 'John Importer', address: '123 Port Road, Logistics City' },
                { name: 'Highland Roasters', email: 'sales@highlandroasters.com', contact: 'Sarah Bean', address: '456 Mountain View, Coffee Valley' },
                { name: 'Coastal Salt Co.', email: 'hello@coastalsalt.com', contact: 'Mike Ocean', address: '789 Shoreline Blvd, Salt Flats' }
            ],
            customers: [
                { name: 'The Ritz-Carlton', email: 'procurement@ritzcarlton.com', phone: '+1-555-0101', city: 'London', address: '150 Piccadilly' },
                { name: 'Blue Bottle Coffee', email: 'supply@bluebottle.com', phone: '+1-555-0102', city: 'Oakland', address: '300 Webster St' },
                { name: 'Gourmet Home Kitchen', email: 'info@gourmethome.com', phone: '+1-555-0103', city: 'Seattle', address: '500 Pike Street' }
            ]
        },
        {
            name: 'Lumina Home Decor',
            slug: 'lumina-home',
            logo: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: 'Lighting', description: 'Modern and ambient lighting solutions' },
                { name: 'Furniture', description: 'Handcrafted wooden and modern furniture' },
                { name: 'Textiles', description: 'Luxury rugs, pillows, and throws' },
                { name: 'Wall Art', description: 'Original paintings and prints' }
            ],
            products: [
                { sku: 'LHD-LIT-001', name: 'Nordic Floor Lamp', price: 189.00, cost: 75.00, brand: 'Lumina', unit: 'pcs' },
                { sku: 'LHD-FUR-002', name: 'Walnut Coffee Table', price: 450.00, cost: 210.00, brand: 'ModernCraft', unit: 'pcs' },
                { sku: 'LHD-TEX-003', name: 'Velvet Throw Pillow', price: 45.00, cost: 15.00, brand: 'SoftTouch', unit: 'pcs' },
                { sku: 'LHD-ART-004', name: 'Abstract Canvas Print', price: 120.00, cost: 40.00, brand: 'VividArt', unit: 'pcs' },
                { sku: 'LHD-ACC-005', name: 'Minimalist Desk Clock', price: 35.00, cost: 12.00, brand: 'Lumina', unit: 'pcs' }
            ],
            suppliers: [
                { name: 'Modern Craft Furniture', email: 'sales@moderncraft.com', contact: 'David Wood', address: 'Workshop Lane, Carpentry District' },
                { name: 'Lumina Optics', email: 'info@luminaoptics.com', contact: 'Jane Light', address: 'Industrial Park, Glass Town' },
                { name: 'Artisan Fabrics Ltd', email: 'orders@artisanfabrics.com', contact: 'Tom Weaver', address: 'Textile Street, Fabric Plaza' }
            ],
            customers: [
                { name: 'Interior Design Studio', email: 'projects@ids.com', phone: '+1-555-0201', city: 'New York', address: '200 Design Ave' },
                { name: 'Grand Plaza Hotels', email: 'admin@grandplaza.com', phone: '+1-555-0202', city: 'Chicago', address: '50 Lakeview Dr' },
                { name: 'Alice Johnson', email: 'alice.j@personal.com', phone: '+1-555-0203', city: 'Austin', address: '123 Austin Way' }
            ]
        },
        {
            name: 'HealthFirst Pharmacy',
            slug: 'healthfirst',
            logo: 'https://images.unsplash.com/photo-1547489432-cf93fa6c71ee?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: 'Vitamins', description: 'Essential vitamins and supplements' },
                { name: 'First Aid', description: 'Emergency medical supplies' },
                { name: 'Hygiene', description: 'Personal care and sanitization' },
                { name: 'Medical Equipment', description: 'Diagnostic tools and devices' }
            ],
            products: [
                { sku: 'HFP-VIT-001', name: 'Multivitamin Pack (60)', price: 29.99, cost: 14.50, brand: 'BioHealth', unit: 'pack' },
                { sku: 'HFP-FA-002', name: 'Emergency First Aid Kit', price: 49.00, cost: 22.00, brand: 'SafeCare', unit: 'kit' },
                { sku: 'HFP-HYG-003', name: 'Antiseptic Hand Wash', price: 8.50, cost: 2.80, brand: 'PureHygiene', unit: 'bottle' },
                { sku: 'HFP-EQP-004', name: 'Digital Thermometer', price: 15.00, cost: 6.00, brand: 'SafeCare', unit: 'pcs' },
                { sku: 'HFP-FA-005', name: 'Organic Cotton Bandages', price: 5.99, cost: 1.50, brand: 'BioHealth', unit: 'pack' }
            ],
            suppliers: [
                { name: 'BioHealth Nutraceuticals', email: 'supply@biohealth.com', contact: 'Dr. Smith', address: 'Biotech Ave, Science Park' },
                { name: 'SafeCare MedTech', email: 'sales@safecare.com', contact: 'Mary Nurse', address: 'Medical Row, Hospital Hill' },
                { name: 'PureHygiene Corp', email: 'hello@purehygiene.com', contact: 'Bob Clean', address: 'Sanitization Blvd, Clean City' }
            ],
            customers: [
                { name: 'Community Wellness Center', email: 'info@wellnesscenter.com', phone: '+1-555-0301', city: 'Miami', address: '100 Health Blvd' },
                { name: 'City General Hospital', email: 'procurement@cityhospital.com', phone: '+1-555-0302', city: 'Boston', address: '45 Harvard Ave' },
                { name: 'Healthy Living Co.', email: 'admin@healthyliving.com', phone: '+1-555-0303', city: 'Seattle', address: '700 Health Ave' }
            ]
        },
        {
            name: 'UrbanStyle Apparel',
            slug: 'urbanstyle-apparel',
            logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: "Men's Wear", description: 'Stylish clothing for men' },
                { name: "Women's Wear", description: 'Fashionable apparel for women' },
                { name: 'Accessories', description: 'Belts, hats, and other styling items' },
                { name: 'Footwear', description: 'Shoes and sneakers for all occasions' }
            ],
            products: [
                { sku: 'USA-MEN-001', name: 'Slim Fit Denim Jeans', price: 89.00, cost: 35.00, brand: 'UrbanStyle', unit: 'pcs' },
                { sku: 'USA-MEN-002', name: 'Organic Cotton T-Shirt', price: 29.00, cost: 8.50, brand: 'UrbanStyle', unit: 'pcs' },
                { sku: 'USA-ACC-003', name: 'Leather Designer Belt', price: 55.00, cost: 18.00, brand: 'UrbanStyle', unit: 'pcs' },
                { sku: 'USA-WOM-004', name: 'Evening Silk Dress', price: 149.00, cost: 65.00, brand: 'UrbanStyle', unit: 'pcs' },
                { sku: 'USA-FTW-005', name: 'Canvas Sneakers', price: 65.00, cost: 25.00, brand: 'UrbanStyle', unit: 'pcs' }
            ],
            suppliers: [
                { name: 'Cotton Mill Co.', email: 'sales@cottonmill.com', contact: 'Alice Weaver', address: 'Textile Hub, Loom Town' },
                { name: 'Leather Works Intl', email: 'orders@leatherworks.com', contact: 'Bob Skinner', address: 'Hide Street, Craft District' },
                { name: 'Style Textiles Group', email: 'info@styletextiles.com', contact: 'Charlie Tailor', address: 'Fashion Yard, Fabric City' }
            ],
            customers: [
                { name: 'Nordstrom', email: 'vendor@nordstrom.com', phone: '+1-555-0401', city: 'Seattle', address: '1601 Zone Parkway' },
                { name: "Macy's", email: 'procurement@macys.com', phone: '+1-555-0402', city: 'Cincinnati', address: '7 West Seventh St' },
                { name: 'Fashion Forward Boutique', email: 'info@fashionforward.com', phone: '+1-555-0403', city: 'Los Angeles', address: '900 Melrose Ave' }
            ]
        },
        {
            name: 'TechNova Systems',
            slug: 'technova',
            logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=200&h=200&auto=format&fit=crop',
            status: 'ACTIVE',
            features: { inventory: true, sales: true, crm: true, procurement: true },
            categories: [
                { name: 'Computers', description: 'Laptops, Desktops and Servers' },
                { name: 'Peripherals', description: 'Keyboards, Mice and Monitors' },
                { name: 'Networking', description: 'Routers, Switches and Cabling' },
                { name: 'Software Licenses', description: 'Enterprise software and cloud services' }
            ],
            products: [
                { sku: 'TNS-COM-001', name: 'ProBook 14" Laptop', price: 1299.00, cost: 850.00, brand: 'TechNova', unit: 'pcs' },
                { sku: 'TNS-PER-002', name: 'Mechanical Keyboard', price: 120.00, cost: 45.00, brand: 'TechNova', unit: 'pcs' },
                { sku: 'TNS-NET-003', name: 'Wi-Fi 6 Router', price: 199.00, cost: 85.00, brand: 'TechNova', unit: 'pcs' },
                { sku: 'TNS-SFT-004', name: 'Cloud Storage 1TB (Annual)', price: 149.00, cost: 40.00, brand: 'TechNova', unit: 'license' },
                { sku: 'TNS-PER-005', name: 'HD Web Camera', price: 85.00, cost: 30.00, brand: 'TechNova', unit: 'pcs' }
            ],
            suppliers: [
                { name: 'Silicon Valley Distrib', email: 'sales@svdistrib.com', contact: 'Gary Gates', address: 'Tech Park, Silicon Valley' },
                { name: 'Global Tech Hub', email: 'orders@globaltechhub.com', contact: 'Susan Chip', address: 'Electronic Way, Shenzhen' },
                { name: 'Network Solutions Inc', email: 'info@networksolutions.com', contact: 'Neil Link', address: 'Copper Drive, connectivity City' }
            ],
            customers: [
                { name: 'Startup Incubator', email: 'tech@incubator.com', phone: '+1-555-0501', city: 'Palo Alto', address: '500 Startup Way' },
                { name: 'Global Corp IT', email: 'itprocurement@globalcorp.com', phone: '+1-555-0502', city: 'London', address: '25 Canary Wharf' },
                { name: 'Tech Savvy Solutions', email: 'admin@techsavvy.com', phone: '+1-555-0503', city: 'Singapore', address: '10 Marina Blvd' }
            ]
        }
    ];

    for (const t of tenantsData) {
        console.log(`--- Seeding Tenant: ${t.name} ---`);

        // Create Tenant
        const tenant = await prisma.tenant.upsert({
            where: { slug: t.slug },
            update: { name: t.name, logo: t.logo, status: t.status, features: t.features },
            create: { name: t.name, slug: t.slug, logo: t.logo, status: t.status, features: t.features }
        });

        // Link Super Admin to Tenant (Support Activities)
        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: superAdminUser.id, tenantId: tenant.id } },
            update: { roleId: superAdminRole.id },
            create: { userId: superAdminUser.id, tenantId: tenant.id, roleId: superAdminRole.id }
        });

        // Create Tenant Admin User
        const tAdminEmail = `storeaiadmin@${t.slug}.com`;
        let tAdminUser = await prisma.user.findUnique({ where: { email: tAdminEmail } });
        if (!tAdminUser) {
            tAdminUser = await prisma.user.create({
                data: {
                    email: tAdminEmail,
                    password: commonPassword,
                    firstName: 'Tenant',
                    lastName: 'Admin',
                    role: 'ADMIN'
                }
            });
            console.log(`✅ Created Tenant Admin: ${tAdminEmail}`);
        }

        // Link Tenant Admin to Tenant
        await prisma.userTenant.upsert({
            where: { userId_tenantId: { userId: tAdminUser.id, tenantId: tenant.id } },
            update: { roleId: adminRole.id },
            create: { userId: tAdminUser.id, tenantId: tenant.id, roleId: adminRole.id }
        });

        // Create Categories
        const createdCategories = [];
        for (const cat of t.categories) {
            const category = await prisma.category.upsert({
                where: { tenantId_name: { tenantId: tenant.id, name: cat.name } },
                update: { description: cat.description },
                create: { name: cat.name, description: cat.description, tenantId: tenant.id }
            });
            createdCategories.push(category);
        }

        // Create Products
        for (let i = 0; i < t.products.length; i++) {
            const p = t.products[i];
            const cat = createdCategories[i % createdCategories.length];
            await prisma.product.upsert({
                where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
                update: {
                    name: p.name,
                    price: p.price,
                    costPrice: p.cost,
                    brand: p.brand,
                    unit: p.unit,
                    categoryId: cat.id,
                    stockQuantity: 100 // Default stock
                },
                create: {
                    sku: p.sku,
                    name: p.name,
                    price: p.price,
                    costPrice: p.cost,
                    brand: p.brand,
                    unit: p.unit,
                    categoryId: cat.id,
                    tenantId: tenant.id,
                    stockQuantity: 100
                }
            });
        }

        // Create Suppliers
        for (const s of t.suppliers) {
            await prisma.supplier.upsert({
                where: { tenantId_email: { tenantId: tenant.id, email: s.email } },
                update: { name: s.name, contact: s.contact, address: s.address },
                create: { name: s.name, email: s.email, contact: s.contact, address: s.address, tenantId: tenant.id }
            });
        }

        // Create Customers
        for (const c of t.customers) {
            await prisma.customer.create({
                data: {
                    name: c.name,
                    email: c.email,
                    phone: c.phone,
                    city: c.city,
                    address: c.address,
                    tenantId: tenant.id
                }
            });
        }
    }

    console.log('✅ Real-World Data Seeding Complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
