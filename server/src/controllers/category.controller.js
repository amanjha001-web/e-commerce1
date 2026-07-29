import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import categoryService from "../services/category.service.js";

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, req.files);

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

/*
|--------------------------------------------------------------------------
| Get All Categories
|--------------------------------------------------------------------------
*/

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Get Category By ID
|--------------------------------------------------------------------------
*/

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Get Category By Slug
|--------------------------------------------------------------------------
*/

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
    req.files,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

/*
|--------------------------------------------------------------------------
| Delete Category
|--------------------------------------------------------------------------
*/

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.deleteCategory(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category deleted successfully"));
});

export {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};
