import { Router } from 'express';
import { getWalletBalance, creditWallet } from '../controllers/walletController';

const router = Router();
router.get('/balance', getWalletBalance);
router.post('/credit', creditWallet);

export default router;
