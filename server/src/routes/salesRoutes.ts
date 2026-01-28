import { Router } from 'express';
import { createSale, getSales, getSaleById, updateSaleTracking } from '../controllers/salesController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('sales:read'), getSales);
router.get('/:id', checkPermission('sales:read'), getSaleById);
router.post('/', checkPermission('sales:write'), createSale);
router.patch('/:id/tracking', checkPermission('sales:write'), updateSaleTracking);

export default router;
