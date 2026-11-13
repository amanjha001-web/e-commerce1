import { Router } from 'express';
import * as profileController from '../../controllers/customer/profile.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', profileController.getProfile);
router.patch('/', profileController.updateProfile);
router.patch('/avatar', upload.single('avatar'), profileController.updateAvatar);
router.delete('/avatar', profileController.deleteAvatar);
router.patch('/username', profileController.updateUsername);
router.patch('/email', profileController.updateEmail);
router.patch('/deactivate', profileController.deactivateAccount);
router.delete('/account', profileController.deleteAccount);

export default router;
