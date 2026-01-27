import { Router } from 'express';
import { getMyTenant, updateTenantBranding, updateTenantFeatures, createTenant, getAllTenants, adminUpdateTenant, getPlans } from '../controllers/tenantController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/me', getMyTenant);
router.get('/all', getAllTenants);
router.get('/plans', getPlans);
router.put('/manage/:id', adminUpdateTenant);
router.put('/branding', updateTenantBranding);
router.put('/features', updateTenantFeatures);
router.post('/', createTenant);

export default router;
