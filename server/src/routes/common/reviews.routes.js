import { Router } from 'express';
import * as reviewController from '../../controllers/common/review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateReviewSchema } from '../../validators/review.validator.js';

const router = Router();

router.get('/my-reviews', authenticate, reviewController.getMyReviews);
router.patch('/:reviewId', authenticate, validate({ body: updateReviewSchema }), reviewController.updateReview);
router.delete('/:reviewId', authenticate, reviewController.deleteReview);
router.post('/:reviewId/helpful', authenticate, reviewController.markHelpful);
router.delete('/:reviewId/helpful', authenticate, reviewController.removeHelpful);

export default router;
