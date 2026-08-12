import mongoose from "mongoose";

import productVariantRepository from "../repositories/productVariant.repository.js";

import ApiError from "../utils/ApiError.js";

import Product from "../models/Product.model.js";

/*                         Create Variant                                     */

const createVariant = async (productId, variantData) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const existingVariant = await productVariantRepository.findBySku(
    variantData.sku,
  );

  if (existingVariant) {
    throw new ApiError(409, "SKU already exists");
  }

  const variant = await productVariantRepository.createVariant({
    ...variantData,

    product: productId,
  });

  return variant;
};

/*                         Get Variant By ID                                  */

const getVariantById = async (variantId) => {
  const variant = await productVariantRepository.findByIdWithProduct(variantId);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  return variant;
};

/*                    Get Product Variants                                    */

const getProductVariants = async (productId) => {
  const variants = await productVariantRepository.findByProductId(productId);

  return variants;
};

/*                         Update Variant                                     */

const updateVariant = async (variantId, updateData) => {
  const variant = await productVariantRepository.findById(variantId);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  if (updateData.sku && updateData.sku !== variant.sku) {
    const skuExists = await productVariantRepository.findBySku(updateData.sku);

    if (skuExists) {
      throw new ApiError(409, "SKU already exists");
    }
  }

  return productVariantRepository.updateVariant(variantId, updateData);
};

/*                         Delete Variant                                     */

const deleteVariant = async (variantId) => {
  const variant = await productVariantRepository.findById(variantId);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  return productVariantRepository.softDelete(variantId);
};

/*                         Restore Variant                                    */

const restoreVariant = async (variantId) => {
  const variant = await productVariantRepository.findById(variantId);

  if (!variant) {
    throw new ApiError(404, "Variant not found");
  }

  return productVariantRepository.restore(variantId);
};

/*                         Stock Management                                   */

const increaseStock = async (variantId, quantity) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }

  return productVariantRepository.increaseStock(variantId, quantity);
};

const decreaseStock = async (variantId, quantity) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Quantity must be greater than zero");
  }

  const variant = await productVariantRepository.decreaseStock(
    variantId,
    quantity,
  );

  if (!variant) {
    throw new ApiError(400, "Insufficient stock");
  }

  return variant;
};

/*                         Reserve Stock                                      */

const reserveStock = async (variantId, quantity, session = null) => {
  if (quantity <= 0) {
    throw new ApiError(400, "Invalid quantity");
  }

  const variant = await productVariantRepository.reserveStock(
    variantId,
    quantity,
    session,
  );

  if (!variant) {
    throw new ApiError(400, "Not enough available stock");
  }

  return variant;
};

/*                         Release Stock                                      */

const releaseStock = async (variantId, quantity, session = null) => {
  return productVariantRepository.releaseStock(variantId, quantity, session);
};

/*                         Check SKU                                         */

const checkSkuAvailability = async (sku) => {
  const variant = await productVariantRepository.findBySku(sku);

  return !variant;
};

export default {
  createVariant,

  getVariantById,

  getProductVariants,

  updateVariant,

  deleteVariant,

  restoreVariant,

  increaseStock,

  decreaseStock,

  reserveStock,

  releaseStock,

  checkSkuAvailability,
};
