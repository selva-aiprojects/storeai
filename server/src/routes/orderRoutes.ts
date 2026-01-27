import { Router } from 'express';
import { createOrder, getOrders, createGoodsReceipt, updateOrderTracking, approveOrder } from '../controllers/orderController';

const router = Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id/approve', approveOrder); // New: Approval Workflow
router.post('/:id/grn', createGoodsReceipt); // New: GRN Protocol (replaces simple receive)
router.patch('/:id/tracking', updateOrderTracking);

export default router;
