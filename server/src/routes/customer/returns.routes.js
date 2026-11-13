import { Router } from 'express';
import { ReturnRequest } from '../../models/ReturnRequest.model.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ userId: req.user._id })
    .populate('orderId')
    .sort({ createdAt: -1 });
  return ApiResponse.success(res, returns, 'Return requests');
}));

export default router;
