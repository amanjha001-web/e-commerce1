import { Router } from 'express';
import { Refund } from '../../models/Refund.model.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { parsePagination } from '../../utils/helpers.js';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [refunds, total] = await Promise.all([
    Refund.find()
      .populate('userId', 'name email phone')
      .populate('orderId', 'orderNumber totalAmount')
      .populate('paymentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Refund.countDocuments(),
  ]);

  return ApiResponse.success(res, { refunds, pagination: { total, page, limit } }, 'Refund requests');
}));

export default router;
