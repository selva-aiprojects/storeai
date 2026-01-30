import { Router } from 'express';
import { getDaybook, createSalesReturn, getLiabilityAging, getProfitAndLoss, processRecurringExpenses } from '../controllers/financeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/daybook', getDaybook);
router.post('/returns', createSalesReturn);
router.get('/aging', getLiabilityAging);
router.get('/pl', getProfitAndLoss);
router.post('/recurring-auto', processRecurringExpenses);

export default router;
