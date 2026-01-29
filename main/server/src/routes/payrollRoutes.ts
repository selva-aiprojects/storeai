import { Router } from 'express';
import { getPayrolls, createPayroll } from '../controllers/payrollController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('payroll:read'), getPayrolls);
router.post('/', checkPermission('payroll:write'), createPayroll);

export default router;
