import { Router } from 'express';
import { getAuditLogs } from '../services/auditService';
import { triggerArchival } from '../services/auditArchivalService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/audit-logs
 * Query audit logs with filters
 */
router.get('/', async (req, res, next) => {
    try {
        const { module, action, entityType, entityId, startDate, endDate, limit, offset } = req.query;
        const user = (req as any).user;

        if (!user || !user.tenantId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const filters = {
            tenantId: user.tenantId,
            module: module as string,
            action: action as string,
            entityType: entityType as string,
            entityId: entityId as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
        };

        const result = await getAuditLogs(filters);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/audit-logs/archive
 * Manually trigger audit log archival
 */
router.post('/archive', async (req, res, next) => {
    try {
        const result = await triggerArchival();
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
