import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import productService from "../services/product.service.js";


// Create Product


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


// Get All Products


const getAllProducts = asyncHandler(async (req, res) => {
  const products = await productService.getAllProducts(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully"));
});


// Get Product By ID


const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});


// Get Product By Slug


const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});


// Update Product


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


// Delete Product


const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id, req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product deleted successfully"));
});

//restore product

const restoreProduct = asyncHandler(async (req, res) => {
  const product = await productService.restoreProduct(req.params.id);

  return res.status(200).json({
    statusCode: 200,
    data: product,
    message: "Product restored successfully",
    success: true,
  });
});

//toggle product status
const toggleProductStatus = asyncHandler(async (req, res) => {
  const product = await productService.toggleProductStatus(req.params.id);

  return res.status(200).json({
    statusCode: 200,
    data: product,
    message: "Product status toggled successfully",
    success: true,
  });
});

//updateProductStock

const updateProductStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  const product = await productService.getProductById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Vendor can update only their own product
  if (
    req.user.role !== "admin" &&
    product.vendor._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to update this product");
  }

  const updatedProduct = await productService.updateProductStock(id, stock);

  return res.status(200).json({
    statusCode: 200,
    data: updatedProduct,
    message: "Product stock updated successfully",
    success: true,
  });
});

//getFlashSaleProducts
const getFlashSaleProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const products = await productService.getFlashSaleProducts(limit);

  return res.status(200).json({
    statusCode: 200,
    data: products,
    message: "Flash sale products fetched successfully",
    success: true,
  });
});

//getTrendingProducts
const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const products = await productService.getTrendingProducts(limit);

  return res
    .status(200)
    .json(
      new ApiResponse(200, products, "Trending products fetched successfully"),
    );
});

//getBestSellerProducts
const getBestSellerProducts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 10;

  const products = await productService.getBestSellerProducts(limit);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        products,
        "Best seller products fetched successfully",
      ),
    );
});

export default {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  restoreProduct,
  toggleProductStatus,
  updateProductStock,
  getFlashSaleProducts,
  getTrendingProducts,
  getBestSellerProducts,
};
