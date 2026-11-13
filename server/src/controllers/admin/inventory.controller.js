import { adminInventoryService } from '../../services/admin/inventory.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getInventory = asyncHandler(async (req, res) => {
  const result = await adminInventoryService.getInventory(req.query);
  return ApiResponse.success(res, result, 'Inventory list');
});

export const getLowStockInventory = asyncHandler(async (req, res) => {
  const items = await adminInventoryService.getLowStockInventory(req.query.threshold, req.query);
  return ApiResponse.success(res, items, 'Low stock items');
});

export const getOutOfStockInventory = asyncHandler(async (req, res) => {
  const items = await adminInventoryService.getOutOfStockInventory(req.query);
  return ApiResponse.success(res, items, 'Out of stock items');
});

export const getInventoryByProductId = asyncHandler(async (req, res) => {
  const inv = await adminInventoryService.getInventoryByProductId(req.params.productId);
  return ApiResponse.success(res, inv, 'Product inventory');
});

export const adjustInventoryStock = asyncHandler(async (req, res) => {
  const inv = await adminInventoryService.adjustInventoryStock(req.params.productId, req.body, req.user._id);
  return ApiResponse.success(res, inv, 'Inventory stock adjusted');
});

export const getInventoryMovements = asyncHandler(async (req, res) => {
  const movements = await adminInventoryService.getInventoryMovements(req.params.productId, req.query);
  return ApiResponse.success(res, movements, 'Inventory movements');
});
