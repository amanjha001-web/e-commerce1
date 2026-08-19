import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import taxService from "../services/tax.service.js";

/*                               Create Tax                                   */

const createTax = asyncHandler(async (req, res) => {
  const tax = await taxService.createTax({
    ...req.body,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tax, "Tax created successfully."));
});

/*                             Get Tax By Id                                  */

const getTaxById = asyncHandler(async (req, res) => {
  const tax = await taxService.getTaxById(req.params.taxId);

  return res.json(new ApiResponse(200, tax, "Tax fetched successfully."));
});

/*                            Get Tax By Code                                 */

const getTaxByCode = asyncHandler(async (req, res) => {
  const tax = await taxService.getTaxByCode(req.params.code);

  return res.json(new ApiResponse(200, tax, "Tax fetched successfully."));
});

/*                          Get Active Taxes                                  */

const getActiveTaxes = asyncHandler(async (req, res) => {
  const taxes = await taxService.getActiveTaxes(req.query);

  return res.json(
    new ApiResponse(200, taxes, "Active taxes fetched successfully."),
  );
});

/*                      Get Taxes By Category                                 */

const getTaxesByCategory = asyncHandler(async (req, res) => {
  const taxes = await taxService.getTaxesByCategory(req.params.categoryId);

  return res.json(
    new ApiResponse(200, taxes, "Category taxes fetched successfully."),
  );
});

/*                      Get Taxes By Location                                 */

const getTaxesByLocation = asyncHandler(async (req, res) => {
  const { country, state } = req.query;

  const taxes = await taxService.getTaxesByLocation(country, state);

  return res.json(
    new ApiResponse(200, taxes, "Location taxes fetched successfully."),
  );
});

/*                            Get All Taxes                                   */

const getAllTaxes = asyncHandler(async (req, res) => {
  const { page, limit, sort, ...filter } = req.query;

  const taxes = await taxService.getTaxes(filter, {
    page,
    limit,
    sort,
  });

  return res.json(new ApiResponse(200, taxes, "Taxes fetched successfully."));
});

/*                         Update Tax Status                               */

const updateTaxStatus = asyncHandler(async (req, res) => {
  const tax = await taxService.updateTaxStatus(
    req.params.taxId,
    req.body.isActive,
    req.user._id,
  );

  return res.json(
    new ApiResponse(
      200,
      tax,
      "Tax status updated successfully.",
    ),
  );
});

/*                           Calculate Tax                                  */

const calculateTax = asyncHandler(async (req, res) => {
  const tax = await taxService.calculateTax(req.body);

  return res.json(
    new ApiResponse(
      200,
      tax,
      "Tax calculated successfully.",
    ),
  );
});

/*                              Update Tax                                    */

const updateTax = asyncHandler(async (req, res) => {
  const tax = await taxService.updateTax(req.params.taxId, {
    ...req.body,
    updatedBy: req.user._id,
  });

  return res.json(new ApiResponse(200, tax, "Tax updated successfully."));
});

/*                              Delete Tax                                    */

const deleteTax = asyncHandler(async (req, res) => {
  const tax = await taxService.deleteTax(req.params.taxId);

  return res.json(new ApiResponse(200, tax, "Tax deleted successfully."));
});

export default{
  createTax,
  getTaxById,
  getTaxByCode,
  getActiveTaxes,
  getTaxesByCategory,
  getTaxesByLocation,
  getAllTaxes,
  updateTaxStatus,
  calculateTax,
  updateTax,
  deleteTax,
};
