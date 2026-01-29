import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function applyViews() {
    console.log('🚀 Applying SQL Reporting Views...');
    const sqlPath = path.join(__dirname, '../../prisma/reporting_views.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error('❌ SQL file not found:', sqlPath);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons for multiple statements
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    try {
        for (const statement of statements) {
            console.log(`Executing statement: ${statement.substring(0, 50)}...`);
            await prisma.$executeRawUnsafe(statement);
        }
        console.log('✅ SQL Views applied successfully.');
    } catch (error: any) {
        console.error('❌ Failed to apply SQL Views:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

applyViews();
