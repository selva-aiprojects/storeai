import { Router } from 'express';
import { getDepartmentalReport, getInventoryReport, getPredictionReport, getFinancialPerformance, getBatchIntegrityReport } from '../controllers/reportController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Restricted based on granular permissions
router.get('/comprehensive', checkPermission('reports:read'), getDepartmentalReport);
router.get('/inventory', checkPermission('inventory:read'), getInventoryReport);
router.get('/prediction', checkPermission('inventory:read'), getPredictionReport);
router.get('/financial-performance', checkPermission('reports:read'), getFinancialPerformance);
router.get('/batch-integrity', checkPermission('inventory:read'), getBatchIntegrityReport);

export default router;
