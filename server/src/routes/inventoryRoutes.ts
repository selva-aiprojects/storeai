import { Router } from 'express';
import { getInventorySummary, createDocument, getKyotoWarehouses } from '../controllers/inventoryController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getInventorySummary);
router.get('/warehouses', getKyotoWarehouses);
router.post('/documents', createDocument);

export default router;
