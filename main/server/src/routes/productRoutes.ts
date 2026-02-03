import { Router } from 'express';
import { getProducts, getGlobalProducts, createProduct, updateProduct, deleteProduct, createPricingRule, getPricingRules } from '../controllers/productController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/all', getGlobalProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/rules', createPricingRule);
router.get('/rules', getPricingRules);

export default router;
