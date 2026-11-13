import { handleRazorpayWebhook } from '../../integrations/razorpay/razorpay.webhook.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const result = await handleRazorpayWebhook(req);
  return ApiResponse.success(res, result, 'Webhook received');
});
