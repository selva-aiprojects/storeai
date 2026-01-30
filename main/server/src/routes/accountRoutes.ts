import { Router } from 'express';
import { getLedger, getFinancialSummary, createPaymentEntry, getTaxSummary, getEntityLedger } from '../controllers/accountsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/ledger', authenticate, getLedger);
router.get('/ledger/:entityId', authenticate, getEntityLedger);
router.get('/summary', authenticate, getFinancialSummary);
router.get('/tax-summary', authenticate, getTaxSummary);
router.post('/payment', authenticate, createPaymentEntry);

export default router;
