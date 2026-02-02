
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmin() {
    console.log("Checking admin@storeai.com...");
    const user = await prisma.user.findUnique({
        where: { email: 'admin@storeai.com' },
        include: {
            tenants: {
                include: {
                    tenant: true,
                    role: true
                }
            }
        }
    });

    if (!user) {
        console.log("USER NOT FOUND: admin@storeai.com");
    } else {
        console.log("USER FOUND:");
        console.log("- ID:", user.id);
        console.log("- Role:", user.role);
        console.log("- Is Active:", user.isActive);
        console.log("- Password Hash Ends With:", user.password.substring(user.password.length - 8));
        console.log("- Tenant Associations:", user.tenants.length);
        user.tenants.forEach(t => {
            console.log(`  * Tenant: ${t.tenant.name} (${t.tenant.slug}), Status: ${t.tenant.status}, Role: ${t.role.code}`);
        });
    }
    await prisma.$disconnect();
}

checkAdmin().catch(console.error);
