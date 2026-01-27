import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, createPricingRule, getPricingRules } from '../controllers/productController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getProducts);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);
router.post('/rules', authenticate, createPricingRule);
router.get('/rules', getPricingRules);

export default router;
