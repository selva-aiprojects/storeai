import express from 'express';
import { chat, healthCheck } from '../controllers/aiController';

const router = express.Router();

router.get('/', (req, res) => res.json({ status: 'AI Service Active', message: 'Send POST to /chat' }));
router.post('/chat', chat);
router.get('/health', healthCheck); // Add health check

export default router;
