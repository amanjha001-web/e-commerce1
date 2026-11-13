import { Router } from 'express';
import * as reviewController from '../../controllers/admin/review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', reviewController.getReviews);
router.get('/reported', reviewController.getReportedReviews);
router.get('/:reviewId', reviewController.getReviewById);
router.patch('/:reviewId/approve', reviewController.approveReview);
router.patch('/:reviewId/reject', reviewController.rejectReview);
router.delete('/:reviewId', reviewController.deleteReview);

export default router;
