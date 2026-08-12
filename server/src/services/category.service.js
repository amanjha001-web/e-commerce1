import slugify from "slugify";

import ApiError from "../utils/ApiError.js";

import categoryRepository from "../repositories/category.repository.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";


/*                               Helper Functions                             */


const generateSlug = async (name, ignoreId = null) => {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await categoryRepository.getCategoryBySlug(slug);

    if (
      !existing ||
      (ignoreId && existing._id.toString() === ignoreId.toString())
    ) {
      break;
    }

    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

const uploadCategoryImage = async (file) => {
  const uploaded = await uploadOnCloudinary(file.path);

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

const removeCategoryImage = async (publicId) => {
  if (!publicId) return;

  try {
    await deleteFromCloudinary(publicId);
  } catch (error) {
    console.error("Category image delete failed:", error.message);
  }
};


/*                            Create Category                                 */


const createCategory = async (categoryData, files) => {
  const {
    name,
    description = "",
    parentCategory = null,
    isFeatured = false,
    sortOrder = 0,
  } = categoryData;

  if (!name?.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const slug = await generateSlug(name.trim());

  let level = 1;

  if (parentCategory) {
    const parent = await categoryRepository.getCategoryById(parentCategory);

    if (!parent) {
      throw new ApiError(404, "Parent category not found");
    }

    if (parent.deletedAt) {
      throw new ApiError(400, "Parent category is deleted");
    }

    level = parent.level + 1;
  }

  let image = {
    url: "",
    publicId: "",
  };

  try {
    if (files?.image && files.image.length > 0) {
      image = await uploadCategoryImage(files.image[0]);
    }

    return await categoryRepository.createCategory({
      name: name.trim(),
      slug,
      description: description.trim(),
      image,
      parentCategory,
      level,
      isFeatured,
      sortOrder,
    });
  } catch (error) {
    if (image.publicId) {
      await removeCategoryImage(image.publicId);
    }

    throw error;
  }
};

/*                           Get Category By Id                               */


const getCategoryById = async (categoryId) => {
  const category =
    await categoryRepository.getCategoryById(categoryId);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (category.deletedAt) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};


/*                          Get Category By Slug                              */


const getCategoryBySlug = async (slug) => {
  const category =
    await categoryRepository.getCategoryBySlug(slug);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};


/*                           Get All Categories                               */


const getAllCategories = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    parentCategory,
    isFeatured,
    isActive,
    sortBy = "sortOrder",
    order = "asc",
  } = query;

  const filter = {};

  if (keyword) {
    filter.$or = [
      {
        name: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        description: {
          $regex: keyword,
          $options: "i",
        },
      },
    ];
  }

  if (parentCategory) {
    filter.parentCategory = parentCategory;
  }

  if (isFeatured !== undefined) {
    filter.isFeatured =
      isFeatured === "true";
  }

  if (isActive !== undefined) {
    filter.isActive =
      isActive === "true";
  }

  const sort = {
    [sortBy]:
      order === "asc" ? 1 : -1,
  };

  return await categoryRepository.getAllCategories(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};

/*                            Update Category                                 */


const updateCategory = async (
  categoryId,
  updateData,
  files,
) => {
  const category =
    await categoryRepository.getCategoryById(
      categoryId,
    );

  if (!category) {
    throw new ApiError(
      404,
      "Category not found",
    );
  }

  /* ------------------------- Update Name & Slug ------------------------- */

  if (
    updateData.name &&
    updateData.name.trim() !== category.name
  ) {
    updateData.slug =
      await generateSlug(
        updateData.name.trim(),
        categoryId,
      );

    updateData.name =
      updateData.name.trim();
  }

  /* ----------------------- Parent Category Check ----------------------- */

  if (updateData.parentCategory) {
    if (
      updateData.parentCategory.toString() ===
      categoryId.toString()
    ) {
      throw new ApiError(
        400,
        "Category cannot be its own parent",
      );
    }

    const parent =
      await categoryRepository.getCategoryById(
        updateData.parentCategory,
      );

    if (!parent) {
      throw new ApiError(
        404,
        "Parent category not found",
      );
    }

    if (parent.deletedAt) {
      throw new ApiError(
        400,
        "Parent category is deleted",
      );
    }

    updateData.level =
      parent.level + 1;
  }

  /* ------------------------- Replace Image ------------------------- */

  if (
    files?.image &&
    files.image.length > 0
  ) {
    let uploadedImage;

    try {
      uploadedImage =
        await uploadCategoryImage(
          files.image[0],
        );

      if (
        category.image?.publicId
      ) {
        await removeCategoryImage(
          category.image.publicId,
        );
      }

      updateData.image =
        uploadedImage;
    } catch (error) {
      if (
        uploadedImage?.publicId
      ) {
        await removeCategoryImage(
          uploadedImage.publicId,
        );
      }

      throw error;
    }
  }

  /* ------------------------- Description ------------------------- */

  if (
    typeof updateData.description ===
    "string"
  ) {
    updateData.description =
      updateData.description.trim();
  }

  /* ------------------------- Save ------------------------- */

  return await categoryRepository.updateCategory(
    categoryId,
    updateData,
  );
};

/*                           Delete Category                                  */


const deleteCategory = async (categoryId) => {
  const category =
    await categoryRepository.getCategoryById(categoryId);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (category.deletedAt) {
    throw new ApiError(400, "Category already deleted");
  }

  // Prevent deleting if it has child categories
  const children =
    await categoryRepository.getAllCategories(
      {
        parentCategory: categoryId,
      },
      {
        page: 1,
        limit: 1,
      },
    );

  if (
    children.categories &&
    children.categories.length > 0
  ) {
    throw new ApiError(
      400,
      "Delete child categories first",
    );
  }

  if (category.image?.publicId) {
    await removeCategoryImage(
      category.image.publicId,
    );
  }

  return await categoryRepository.deleteCategory(
    categoryId,
  );
};


/*                          Restore Category                                  */


const restoreCategory = async (
  categoryId,
) => {
  const category =
    await categoryRepository.getCategoryById(categoryId);

  if (!category) {
    throw new ApiError(
      404,
      "Category not found",
    );
  }

  return await categoryRepository.updateCategory(
    categoryId,
    {
      deletedAt: null,
      isActive: true,
    },
  );
};


/*                       Toggle Category Status                               */


const toggleCategoryStatus = async (
  categoryId,
) => {
  const category =
    await categoryRepository.getCategoryById(categoryId);

  if (!category) {
    throw new ApiError(
      404,
      "Category not found",
    );
  }

  return await categoryRepository.updateCategory(
    categoryId,
    {
      isActive: !category.isActive,
    },
  );
};


/*                                  Export                                    */


export default {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getAllCategories,
  updateCategory,
  deleteCategory,
  restoreCategory,
  toggleCategoryStatus,
};