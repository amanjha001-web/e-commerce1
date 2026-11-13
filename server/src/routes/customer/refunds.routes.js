import { Router } from 'express';
import { Refund } from '../../models/Refund.model.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const refunds = await Refund.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return ApiResponse.success(res, refunds, 'Customer refunds retrieved');
}));

router.get('/:refundId', asyncHandler(async (req, res) => {
  const refund = await Refund.findOne({ _id: req.params.refundId, userId: req.user._id });
  return ApiResponse.success(res, refund, 'Refund details');
}));

export default router;
