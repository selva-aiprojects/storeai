import { Router } from 'express';
import { createOrder, getOrders, receiveOrder, updateOrderTracking } from '../controllers/orderController';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id/receive', receiveOrder);
router.patch('/:id/tracking', updateOrderTracking);

export default router;
