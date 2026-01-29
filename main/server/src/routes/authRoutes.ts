import { Router } from 'express';
import { login, requestOnboarding, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/onboard', requestOnboarding);
router.get('/me', authenticate, getMe);

export default router;
