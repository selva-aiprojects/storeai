import { Router } from 'express';
import { login, register, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register); // In a real app, registration might be restricted to ADMIN
router.get('/me', authenticate, getMe);

export default router;
