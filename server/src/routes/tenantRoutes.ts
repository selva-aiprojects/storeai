import { Router } from 'express';
import { getMyTenant, updateTenantBranding, updateTenantFeatures, createTenant, getAllTenants, adminUpdateTenant, getPlans } from '../controllers/tenantController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/me', getMyTenant);
router.get('/all', checkPermission('tenants:manage'), getAllTenants);
router.get('/plans', checkPermission('tenants:manage'), getPlans);
router.put('/manage/:id', checkPermission('tenants:manage'), adminUpdateTenant);
router.put('/branding', checkPermission('tenants:manage'), updateTenantBranding);
router.put('/features', checkPermission('tenants:manage'), updateTenantFeatures);
router.post('/', checkPermission('tenants:manage'), createTenant);

export default router;
