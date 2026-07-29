import slugify from "slugify";
import ApiError from "../utils/ApiError.js";
import categoryRepository from "../repositories/category.repository.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/*
|--------------------------------------------------------------------------
| Create Category
|--------------------------------------------------------------------------
*/

const createCategory = async (categoryData, files) => {
  const { name, description, parentCategory, isFeatured, sortOrder } =
    categoryData;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const slug = slugify(name, {
    lower: true,
    strict: true,
  });

  const existingCategory = await categoryRepository.getCategoryBySlug(slug);

  if (existingCategory) {
    throw new ApiError(409, "Category already exists");
  }

  let image = {
    url: "",
    publicId: "",
  };

  if (files?.image?.length) {
    const uploadedImage = await uploadOnCloudinary(files.image[0].path);

    image = {
      url: uploadedImage.secure_url,
      publicId: uploadedImage.public_id,
    };
  }

  let level = 1;

  if (parentCategory) {
    const parent = await categoryRepository.getCategoryById(parentCategory);

    if (!parent) {
      throw new ApiError(404, "Parent category not found");
    }

    level = parent.level + 1;
  }

  return await categoryRepository.createCategory({
    name,
    slug,
    description,
    image,
    parentCategory: parentCategory || null,
    level,
    isFeatured,
    sortOrder,
  });
};

/*
|--------------------------------------------------------------------------
| Get Category By ID
|--------------------------------------------------------------------------
*/

const getCategoryById = async (id) => {
  const category = await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

/*
|--------------------------------------------------------------------------
| Get Category By Slug
|--------------------------------------------------------------------------
*/

const getCategoryBySlug = async (slug) => {
  const category = await categoryRepository.getCategoryBySlug(slug);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

/*
|--------------------------------------------------------------------------
| Get All Categories
|--------------------------------------------------------------------------
*/

const getAllCategories = async () => {
  return await categoryRepository.getAllCategories();
};
/*
|--------------------------------------------------------------------------
| Update Category
|--------------------------------------------------------------------------
*/

const updateCategory = async (id, data, files) => {
  const category = await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // Duplicate Name Check
  if (data.name && data.name !== category.name) {
    const slug = slugify(data.name, {
      lower: true,
      strict: true,
    });

    const existingCategory =
      await categoryRepository.getCategoryBySlug(slug);

    if (
      existingCategory &&
      existingCategory._id.toString() !== id
    ) {
      throw new ApiError(
        409,
        "Category already exists"
      );
    }

    data.slug = slug;
  }

  // Parent Category Validation
  if (data.parentCategory) {
    if (data.parentCategory === id) {
      throw new ApiError(
        400,
        "Category cannot be its own parent"
      );
    }

    const parent =
      await categoryRepository.getCategoryById(
        data.parentCategory
      );

    if (!parent) {
      throw new ApiError(
        404,
        "Parent category not found"
      );
    }

    data.level = parent.level + 1;
  }

  /*
  |--------------------------------------------------------------------------
  | Replace Category Image
  |--------------------------------------------------------------------------
  */

  if (files?.image?.length) {
    if (category.image?.publicId) {
      await deleteFromCloudinary(
        category.image.publicId
      );
    }

    const uploaded =
      await uploadOnCloudinary(
        files.image[0].path
      );

    data.image = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  }

  return await categoryRepository.updateCategory(
    id,
    data
  );
};

/*
|--------------------------------------------------------------------------
| Delete Category (Soft Delete)
|--------------------------------------------------------------------------
*/

const deleteCategory = async (id) => {
  const category =
    await categoryRepository.getCategoryById(id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return await categoryRepository.deleteCategory(id);
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getAllCategories,
  updateCategory,
  deleteCategory,
};