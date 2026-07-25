import { Router } from 'express';
import { validateCoupon, getPromotions } from '../controllers/promotionController';

const router = Router();
router.get('/', getPromotions);
router.post('/validate', validateCoupon);

export default router;
