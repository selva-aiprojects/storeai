
import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/db-check', async (req, res) => {
    try {
        console.log('--- DEBUG: Checking DB Connection ---');
        const userCount = await prisma.user.count();
        console.log(`--- DEBUG: Success. Users found: ${userCount} ---`);
        res.json({
            success: true,
            message: 'Database connection successful',
            userCount,
            env_db_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'NOT_SET'
        });
    } catch (error: any) {
        console.error('--- DEBUG: DB Connection Failed ---', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

export default router;
