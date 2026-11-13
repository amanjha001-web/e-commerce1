import { Router } from 'express';
import * as userController from '../../controllers/admin/user.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', userController.getUsers);
router.get('/:userId', userController.getUserById);
router.patch('/:userId', userController.updateUser);
router.patch('/:userId/status', userController.updateUserStatus);
router.put('/:userId/status', userController.updateUserStatus);
router.patch('/:userId/toggle-status', userController.toggleUserStatus);
router.delete('/:userId', userController.deleteUser);

export default router;
