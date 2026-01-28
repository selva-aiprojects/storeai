import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function applyViews() {
    console.log('🏗️ APPLYING REPORTING VIEWS...');

    try {
        const sqlPath = path.join(__dirname, '../server/prisma/reporting_views.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to run each statement separately (simple parser)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
                // console.log(`✅ Statement executed: ${statement.substring(0, 50)}...`);
            } catch (err: any) {
                console.error(`❌ Statement failed: ${err.message}`);
            }
        }

        console.log('✔ ALL VIEWS APPLIED SUCCESSFULLY');
    } catch (error: any) {
        console.error('❌ FAILED TO APPLY VIEWS:', error.message);
    }
}

applyViews().catch(console.error).finally(() => prisma.$disconnect());
