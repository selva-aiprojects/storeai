import { Router } from 'express';
import { createSale, getSales, getSaleById, updateSaleTracking } from '../controllers/salesController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.patch('/:id/tracking', updateSaleTracking);

export default router;
