import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Restricted to users with user management permissions
router.use(authenticate, checkPermission('users:manage'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
