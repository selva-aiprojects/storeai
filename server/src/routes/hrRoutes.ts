import { Router } from 'express';
import { getEmployees, markAttendance, updatePerformance, createEmployee, getDepartments } from '../controllers/hrController';

const router = Router();

router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.get('/departments', getDepartments);
router.post('/attendance', markAttendance);
router.patch('/performance/:id', updatePerformance);

export default router;
