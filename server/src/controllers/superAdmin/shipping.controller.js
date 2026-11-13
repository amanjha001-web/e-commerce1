import { superAdminShippingService } from '../../services/superAdmin/shipping.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getShippingZones = asyncHandler(async (req, res) => {
  const zones = await superAdminShippingService.getAll(req.query);
  return ApiResponse.success(res, zones, 'Shipping zones');
});

export const getShippingZoneById = asyncHandler(async (req, res) => {
  const zone = await superAdminShippingService.getById(req.params.zoneId);
  return ApiResponse.success(res, zone, 'Shipping zone details');
});

export const createShippingZone = asyncHandler(async (req, res) => {
  const zone = await superAdminShippingService.create(req.body);
  return ApiResponse.created(res, zone, 'Shipping zone created');
});

export const updateShippingZone = asyncHandler(async (req, res) => {
  const zone = await superAdminShippingService.update(req.params.zoneId, req.body);
  return ApiResponse.success(res, zone, 'Shipping zone updated');
});

export const deleteShippingZone = asyncHandler(async (req, res) => {
  const result = await superAdminShippingService.delete(req.params.zoneId);
  return ApiResponse.success(res, result, result.message);
});

export const updateShippingZoneStatus = asyncHandler(async (req, res) => {
  const zone = await superAdminShippingService.updateStatus(req.params.zoneId, req.body.isActive);
  return ApiResponse.success(res, zone, 'Shipping zone status updated');
});
