import { Router } from 'express';
import * as productController from '../../controllers/common/product.controller.js';
import * as reviewController from '../../controllers/common/review.controller.js';
import { optionalAuthenticate, authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createReviewSchema } from '../../validators/review.validator.js';

const router = Router();

router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/flash-sale', productController.getFlashSaleProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/best-sellers', productController.getBestSellerProducts);
router.get('/new-arrivals', productController.getNewArrivalProducts);
router.get('/recently-viewed', authenticate, productController.getRecentlyViewed);
router.post('/:productId/recently-viewed', authenticate, productController.addRecentlyViewed);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/brand/:brandId', productController.getProductsByBrand);
router.get('/:productId/related', productController.getRelatedProducts);

// Product details
router.get('/:productId', productController.getProductById);

// Reviews for product
router.get('/:productId/reviews', reviewController.getProductReviews);
router.get('/:productId/reviews/summary', reviewController.getProductRatingSummary);
router.post('/:productId/reviews', authenticate, validate({ body: createReviewSchema }), reviewController.createReview);

export default router;
