import { Router } from 'express';
import { getProductReviews, createReview, moderateReview } from '../controllers/reviewController';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.get('/', getProductReviews);
router.post('/', createReview);
router.patch('/:reviewId/status', moderateReview);

export default router;
