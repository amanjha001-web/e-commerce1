import { Router } from 'express';
import * as vendorReviewController from '../../controllers/vendor/review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireVendor } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireVendor);

router.get('/', vendorReviewController.getVendorReviews);
router.post('/:reviewId/reply', vendorReviewController.replyToReview);

export default router;
