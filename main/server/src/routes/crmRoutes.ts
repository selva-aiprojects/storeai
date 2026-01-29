import { Router } from 'express';
import { getDeals, createDeal, updateDealStage, addActivity } from '../controllers/crmController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getDeals);
router.post('/', createDeal);
router.patch('/:id/stage', updateDealStage);
router.post('/:id/activities', addActivity);

export default router;
