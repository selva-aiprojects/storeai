import express from 'express';
import { chat, marketResearch, stockAnalyze, healthCheck } from '../controllers/aiController';

const router = express.Router();

router.post('/chat', chat);
router.get('/health', healthCheck); // Add health check
router.post('/stock-analyze', stockAnalyze);
router.get('/market-research', marketResearch);

export default router;
