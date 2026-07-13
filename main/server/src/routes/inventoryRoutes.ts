import { Router } from 'express';
import { getInventorySummary, createDocument, getKyotoWarehouses, processInwardEntry, getBatchStockSummary } from '../controllers/inventoryController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/summary', getInventorySummary);
router.get('/warehouses', getKyotoWarehouses);
router.get('/batches', getBatchStockSummary);
router.post('/documents', checkPermission('inventory:write'), createDocument);
router.post('/inward', checkPermission('inventory:write'), processInwardEntry);

export default router;
