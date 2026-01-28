
import { Router } from 'express';
import { getDailyAttendance, markAttendance } from '../controllers/attendanceController';
import { checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.get('/', checkPermission('hr:read'), getDailyAttendance);
router.post('/', checkPermission('hr:write'), markAttendance);

export default router;
