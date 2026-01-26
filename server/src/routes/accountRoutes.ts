import { Router } from 'express';
import { getLedger, getFinancialSummary, createPaymentEntry } from '../controllers/accountsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/ledger', authenticate, getLedger);
router.get('/summary', authenticate, getFinancialSummary);
router.post('/payment', authenticate, createPaymentEntry);

export default router;
