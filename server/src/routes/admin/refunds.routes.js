import { Router } from 'express';
import { adminRefundService } from '../../services/admin/refund.service.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/role.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Return requests (placed before `/:refundId` so `/returns` doesn't collide)
router.get(
  '/returns',
  asyncHandler(async (req, res) => {
    const result = await adminRefundService.getReturnRequests(req.query);
    return ApiResponse.success(res, result, 'Return requests');
  })
);

router.patch(
  '/returns/:returnId/approve',
  asyncHandler(async (req, res) => {
    const result = await adminRefundService.approveReturnRequest(
      req.params.returnId,
      req.body,
      req.user._id
    );
    return ApiResponse.success(res, result, 'Return request approved');
  })
);

router.patch(
  '/returns/:returnId/reject',
  asyncHandler(async (req, res) => {
    const result = await adminRefundService.rejectReturnRequest(
      req.params.returnId,
      req.body,
      req.user._id
    );
    return ApiResponse.success(res, result, 'Return request rejected');
  })
);

// Refund requests
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await adminRefundService.getRefunds(req.query);
    return ApiResponse.success(res, result, 'Refund requests');
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = await adminRefundService.createManualRefund(req.body, req.user._id);
    return ApiResponse.created(res, result, 'Refund processed successfully');
  })
);

router.get(
  '/:refundId',
  asyncHandler(async (req, res) => {
    const refund = await adminRefundService.getRefundById(req.params.refundId);
    return ApiResponse.success(res, refund, 'Refund details');
  })
);

router.patch(
  '/:refundId/approve',
  asyncHandler(async (req, res) => {
    const result = await adminRefundService.approveRefund(
      req.params.refundId,
      req.body,
      req.user._id
    );
    return ApiResponse.success(res, result, 'Refund approved and processed');
  })
);

router.patch(
  '/:refundId/reject',
  asyncHandler(async (req, res) => {
    const refund = await adminRefundService.rejectRefund(
      req.params.refundId,
      req.body,
      req.user._id
    );
    return ApiResponse.success(res, refund, 'Refund request rejected');
  })
);

export default router;
