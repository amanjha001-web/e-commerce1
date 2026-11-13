import { Router } from 'express';
import * as reviewController from '../../controllers/common/review.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateReviewSchema } from '../../validators/review.validator.js';

const router = Router();

router.use(authenticate);

router.get('/my-reviews', reviewController.getMyReviews);
router.patch('/:reviewId', validate({ body: updateReviewSchema }), reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);
router.post('/:reviewId/helpful', reviewController.markHelpful);
router.delete('/:reviewId/helpful', reviewController.removeHelpful);

export default router;
