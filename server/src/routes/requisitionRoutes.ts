import { Router } from 'express';
import { getRequisitions, createRequisition, updateRequisitionStatus } from '../controllers/requisitionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getRequisitions);
router.post('/', createRequisition);
router.patch('/:id/status', updateRequisitionStatus);

export default router;
