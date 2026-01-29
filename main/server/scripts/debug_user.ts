
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
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
    console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
