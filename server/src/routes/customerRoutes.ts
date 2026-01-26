import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomer } from '../controllers/customerController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);

export default router;
