import { Router } from 'express';
import { getPayrolls, createPayroll } from '../controllers/payrollController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT', 'HR']), getPayrolls);
router.post('/', authorize(['ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT']), createPayroll);

export default router;
