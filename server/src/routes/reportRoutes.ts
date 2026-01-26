import { Router } from 'express';
import { getDepartmentalReport, getInventoryReport, getPredictionReport } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

// Restricted to Management and Admins
router.get('/comprehensive', authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGEMENT']), getDepartmentalReport);
router.get('/inventory', authorize(['ADMIN', 'SUPER_ADMIN', 'OPERATIONS', 'MANAGEMENT']), getInventoryReport);
router.get('/prediction', authorize(['ADMIN', 'SUPER_ADMIN', 'MANAGEMENT']), getPredictionReport);

export default router;
