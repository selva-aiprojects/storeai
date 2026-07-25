import { Router } from 'express';
import { getReturnRequests, createReturnRequest, updateReturnStatus } from '../controllers/rmaController';

const router = Router();

router.get('/', getReturnRequests);
router.post('/', createReturnRequest);
router.patch('/:id/status', updateReturnStatus);

export default router;
