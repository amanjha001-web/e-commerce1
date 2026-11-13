import { vendorInventoryService } from '../../services/vendor/inventory.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getInventory = asyncHandler(async (req, res) => {
  const result = await vendorInventoryService.getInventory(req.user._id, req.query);
  return ApiResponse.success(res, result, 'Vendor inventory');
});

export const updateInventory = asyncHandler(async (req, res) => {
  const result = await vendorInventoryService.updateInventory(req.user._id, req.params.productId, req.body);
  return ApiResponse.success(res, result, 'Inventory updated');
});
