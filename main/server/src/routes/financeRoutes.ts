import { Router } from 'express';
import { getDaybook, createSalesReturn, getLiabilityAging, getProfitAndLoss, processRecurringExpenses, getBalanceSheet } from '../controllers/financeController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/daybook', getDaybook);
router.get('/ledger', getDaybook); // Unified Audit Trail
router.post('/returns', createSalesReturn);
router.get('/aging', getLiabilityAging);
router.get('/pl', getProfitAndLoss);
router.get('/balance-sheet', getBalanceSheet);
router.post('/recurring-auto', processRecurringExpenses);

export default router;
