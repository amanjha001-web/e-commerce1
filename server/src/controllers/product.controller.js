import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import productService from "../services/product.service.js";

/*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(
    req.body,
    req.files,
    req.user,
  );

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Get Product By ID
|--------------------------------------------------------------------------
*/

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Get Product By Slug
|--------------------------------------------------------------------------
*/

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Update Product
|--------------------------------------------------------------------------
*/

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(
    req.params.id,
    req.body,
    req.files,
    req.user,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
});

/*
|--------------------------------------------------------------------------
| Delete Product
|--------------------------------------------------------------------------
*/

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product deleted successfully"));
});

export {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
};
