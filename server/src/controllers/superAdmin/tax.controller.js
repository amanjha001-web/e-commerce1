import { superAdminTaxService } from '../../services/superAdmin/tax.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const getTaxes = asyncHandler(async (req, res) => {
  const taxes = await superAdminTaxService.getAll(req.query);
  return ApiResponse.success(res, taxes, 'Tax configurations');
});

export const getTaxById = asyncHandler(async (req, res) => {
  const tax = await superAdminTaxService.getById(req.params.taxId);
  return ApiResponse.success(res, tax, 'Tax configuration');
});

export const createTax = asyncHandler(async (req, res) => {
  const tax = await superAdminTaxService.create(req.body);
  return ApiResponse.created(res, tax, 'Tax configuration created');
});

export const updateTax = asyncHandler(async (req, res) => {
  const tax = await superAdminTaxService.update(req.params.taxId, req.body);
  return ApiResponse.success(res, tax, 'Tax configuration updated');
});

export const deleteTax = asyncHandler(async (req, res) => {
  const result = await superAdminTaxService.delete(req.params.taxId);
  return ApiResponse.success(res, result, result.message);
});

export const updateTaxStatus = asyncHandler(async (req, res) => {
  const tax = await superAdminTaxService.updateStatus(req.params.taxId, req.body.isActive);
  return ApiResponse.success(res, tax, 'Tax status updated');
});
