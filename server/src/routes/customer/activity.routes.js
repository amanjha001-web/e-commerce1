import { Router } from 'express';
import * as activityController from '../../controllers/customer/activity.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/recently-viewed', activityController.getRecentlyViewed);
router.get('/reviews', activityController.getMyReviews);
router.get('/summary', activityController.getActivitySummary);

export default router;
