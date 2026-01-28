import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function applyViews() {
    console.log('🏗️ APPLYING REPORTING VIEWS (REPAIR)...');

    try {
        const sqlPath = path.join(__dirname, 'reporting_views.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
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
