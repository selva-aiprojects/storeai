import { Router } from 'express';
import { getEmployees, markAttendance, updatePerformance, createEmployee, getDepartments, generatePayroll } from '../controllers/hrController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/employees', checkPermission('hr:read'), getEmployees);
router.post('/employees', checkPermission('hr:write'), createEmployee);
router.get('/departments', checkPermission('hr:read'), getDepartments);
router.post('/attendance', checkPermission('hr:write'), markAttendance);
router.patch('/performance/:id', checkPermission('hr:write'), updatePerformance);

router.post('/payroll/generate', checkPermission('hr:write'), generatePayroll);

export default router;
