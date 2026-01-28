import { Router } from 'express';
import { createOrder, getOrders, createGoodsReceipt, updateOrderTracking, approveOrder } from '../controllers/orderController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('orders:read'), getOrders);
router.post('/', checkPermission('orders:write'), createOrder);
router.patch('/:id/approve', checkPermission('orders:write'), approveOrder); // New: Approval Workflow
router.post('/:id/grn', checkPermission('orders:write'), createGoodsReceipt); // New: GRN Protocol (replaces simple receive)
router.patch('/:id/tracking', checkPermission('orders:write'), updateOrderTracking);

export default router;
