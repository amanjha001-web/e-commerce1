import Category from "../models/Category.model.js";

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

const createCategory = async (categoryData) => {
  return await Category.create(categoryData);
};

/*
|--------------------------------------------------------------------------
| Get Category By ID
|--------------------------------------------------------------------------
*/

const getCategoryById = async (id) => {
  return await Category.findById(id).populate("parentCategory", "name slug");
};

/*
|--------------------------------------------------------------------------
| Get Category By Slug
|--------------------------------------------------------------------------
*/

const getCategoryBySlug = async (slug) => {
  return await Category.findOne({
    slug,
    isActive: true,
    deletedAt: null,
  }).populate("parentCategory", "name slug");
};

/*
|--------------------------------------------------------------------------
| Get Category By Name
|--------------------------------------------------------------------------
*/

const getCategoryByName = async (name) => {
  return await Category.findOne({
    name,
    deletedAt: null,
  });
};

/*
|--------------------------------------------------------------------------
| Get All Categories
|--------------------------------------------------------------------------
*/

const getAllCategories = async () => {
  return await Category.find({
    isActive: true,
    deletedAt: null,
  })
    .populate("parentCategory", "name slug")
    .sort({
      sortOrder: 1,
      createdAt: -1,
    });
};

/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

const updateCategory = async (id, data) => {
  return await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("parentCategory", "name slug");
};

/*
|--------------------------------------------------------------------------
| Soft Delete Category
|--------------------------------------------------------------------------
*/

const deleteCategory = async (id) => {
  return await Category.findByIdAndUpdate(
    id,
    {
      isActive: false,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

export default {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategoryByName,
  getAllCategories,
  updateCategory,
  deleteCategory,
};
