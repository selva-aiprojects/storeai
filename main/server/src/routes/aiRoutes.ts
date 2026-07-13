import express from 'express';
import { chat, healthCheck } from '../controllers/aiController';

const router = express.Router();

router.post('/chat', chat);
router.get('/health', healthCheck); // Add health check

export default router;
