import Category from "../models/Category.model.js";

/*                           Create Category                                  */

const createCategory = async (categoryData, session = null) => {
  const category = await Category.create([categoryData], {
    session,
  });

  return category[0];
};

/*                           Get Category By Id                               */

const getCategoryById = async (categoryId) => {
  return await Category.findOne({
    _id: categoryId,
    deletedAt: null,
  })
    .populate("parentCategory", "name slug")
    .lean();
};

/*                         Get Category By Slug                               */

const getCategoryBySlug = async (slug) => {
  return await Category.findOne({
    slug,
    isActive: true,
    deletedAt: null,
  })
    .populate("parentCategory", "name slug")
    .lean();
};

/*                         Get Category By Name                               */

const getCategoryByName = async (name) => {
  return await Category.findOne({
    name: {
      $regex: new RegExp(`^${name}$`, "i"),
    },
    deletedAt: null,
  }).lean();
};

/*                           Get All Categories                               */

const getAllCategories = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      sortOrder: 1,
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const query = {
    ...filter,
    deletedAt: null,
  };

  const [categories, totalCategories] = await Promise.all([
    Category.find(query)
      .populate("parentCategory", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Category.countDocuments(query),
  ]);

  return {
    categories,

    pagination: {
      totalCategories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalCategories / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                      Get Featured Categories                               */

const getFeaturedCategories = async (limit = 10) => {
  return await Category.find({
    isFeatured: true,
    isActive: true,
    deletedAt: null,
  })
    .sort({
      sortOrder: 1,
    })
    .limit(limit)
    .lean();
};

/*                        Search Categories                                   */

const searchCategories = async (keyword) => {
  return await Category.find({
    deletedAt: null,

    $or: [
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
    ],
  }).lean();
};
/*                         Get Root Categories                                */

const getRootCategories = async () => {
  return await Category.find({
    parentCategory: null,
    isActive: true,
    deletedAt: null,
  })
    .sort({
      sortOrder: 1,
    })
    .lean();
};

/*                        Get Child Categories                                */

const getChildCategories = async (parentCategoryId) => {
  return await Category.find({
    parentCategory: parentCategoryId,
    isActive: true,
    deletedAt: null,
  })
    .sort({
      sortOrder: 1,
    })
    .lean();
};

/*                           Update Category                                  */

const updateCategory = async (
  categoryId,
  updateData,
  session = null,
) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  ).populate("parentCategory", "name slug");
};

/*                          Toggle Featured                                   */

const toggleFeatured = async (
  categoryId,
  isFeatured,
  session = null,
) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    {
      isFeatured,
    },
    {
      new: true,
      session,
    },
  );
};

/*                           Toggle Active                                    */

const toggleActive = async (
  categoryId,
  isActive,
  session = null,
) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive,
    },
    {
      new: true,
      session,
    },
  );
};

/*                         Soft Delete Category                               */

const deleteCategory = async (
  categoryId,
  session = null,
) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive: false,
      deletedAt: new Date(),
    },
    {
      new: true,
      session,
    },
  );
};

/*                         Restore Category                                   */

const restoreCategory = async (
  categoryId,
  session = null,
) => {
  return await Category.findByIdAndUpdate(
    categoryId,
    {
      isActive: true,
      deletedAt: null,
    },
    {
      new: true,
      session,
    },
  );
};

/*                                  Export                                    */

export default {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategoryByName,
  getAllCategories,
  getFeaturedCategories,
  searchCategories,
  getRootCategories,
  getChildCategories,
  updateCategory,
  toggleFeatured,
  toggleActive,
  deleteCategory,
  restoreCategory,
};