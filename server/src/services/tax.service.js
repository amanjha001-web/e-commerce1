import mongoose from "mongoose";

import taxRepository from "../repositories/tax.repository.js";

import ApiError from "../utils/ApiError.js";

/*                               Create Tax                                   */

const createTax = async (taxData) => {
  const existingTax = await taxRepository.findTaxByCode(taxData.code);

  if (existingTax) {
    throw new ApiError(409, "Tax code already exists.");
  }

  if (
    taxData.effectiveFrom &&
    taxData.effectiveTo &&
    new Date(taxData.effectiveFrom) > new Date(taxData.effectiveTo)
  ) {
    throw new ApiError(
      400,
      "Effective from date cannot be greater than effective to date.",
    );
  }

  return taxRepository.createTax(taxData);
};

/*                            Get Tax By Id                                   */

const getTaxById = async (taxId) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax id.");
  }

  const tax = await taxRepository.findTaxById(taxId);

  if (!tax) {
    throw new ApiError(404, "Tax not found.");
  }

  return tax;
};

/*                           Get Tax By Code                                  */

const getTaxByCode = async (code) => {
  const tax = await taxRepository.findTaxByCode(code.toUpperCase());

  if (!tax) {
    throw new ApiError(404, "Tax not found.");
  }

  return tax;
};

/*                         Get Active Taxes                                   */

const getActiveTaxes = async (filter = {}) => {
  return taxRepository.findActiveTaxes(filter);
};

/*                    Get Taxes By Category                                   */

const getTaxesByCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new ApiError(400, "Invalid category id.");
  }

  return taxRepository.findTaxesByCategory(categoryId);
};

/*                    Get Taxes By Location                                   */

const getTaxesByLocation = async (country, state) => {
  return taxRepository.findTaxesByLocation(country, state);
};

/*                           Get All Taxes                                    */

const getTaxes = async (filter = {}, query = {}) => {
  return taxRepository.findTaxes(filter, query);
};

/*                              Update Tax                                    */

const updateTax = async (taxId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax id.");
  }

  const existingTax = await taxRepository.findTaxById(taxId);

  if (!existingTax) {
    throw new ApiError(404, "Tax not found.");
  }

  if (updateData.code && updateData.code !== existingTax.code) {
    const duplicate = await taxRepository.findTaxByCode(updateData.code);

    if (duplicate) {
      throw new ApiError(409, "Tax code already exists.");
    }
  }

  const effectiveFrom = updateData.effectiveFrom || existingTax.effectiveFrom;

  const effectiveTo = updateData.effectiveTo || existingTax.effectiveTo;

  if (
    effectiveFrom &&
    effectiveTo &&
    new Date(effectiveFrom) > new Date(effectiveTo)
  ) {
    throw new ApiError(400, "Invalid effective dates.");
  }

  return taxRepository.updateTax(taxId, updateData);
};

/*                            Delete Tax                                      */

const deleteTax = async (taxId) => {
  if (!mongoose.Types.ObjectId.isValid(taxId)) {
    throw new ApiError(400, "Invalid tax id.");
  }

  const tax = await taxRepository.softDeleteTax(taxId);

  if (!tax) {
    throw new ApiError(404, "Tax not found.");
  }

  return tax;
};

export default {
  createTax,
  getTaxById,
  getTaxByCode,
  getActiveTaxes,
  getTaxesByCategory,
  getTaxesByLocation,
  getTaxes,
  updateTax,
  deleteTax,
};
