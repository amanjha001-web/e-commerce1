import { Router } from 'express';
import * as settingController from '../../controllers/superAdmin/setting.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireSuperAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', settingController.getSettings);
router.patch('/', settingController.updateSettings);
router.get('/:key', settingController.getSettingByKey);
router.patch('/:key', settingController.updateSetting);

export default router;
