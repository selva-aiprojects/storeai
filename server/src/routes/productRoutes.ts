import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, createPricingRule, getPricingRules } from '../controllers/productController';

const router = Router();

router.get('/', getProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/rules', createPricingRule);
router.get('/rules', getPricingRules);

export default router;
