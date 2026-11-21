import { Router } from 'express';
import { getPublicSettings } from '../../controllers/superAdmin/setting.controller.js';

const router = Router();

router.get('/', getPublicSettings);
router.get('/public', getPublicSettings);

export default router;
