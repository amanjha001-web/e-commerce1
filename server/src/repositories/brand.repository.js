import Brand from "../models/Brand.model.js";

/*                              Create Brand                                  */

const createBrand = async (brandData, session = null) => {
  const brand = await Brand.create([brandData], {
    session,
  });

  return brand[0];
};

/*                             Get Brand By Id                                */

const getBrandById = async (brandId) => {
  return await Brand.findOne({
    _id: brandId,
    deletedAt: null,
  }).lean();
};

/*                            Get Brand By Slug                               */

const getBrandBySlug = async (slug) => {
  return await Brand.findOne({
    slug,
    deletedAt: null,
    isActive: true,
  }).lean();
};

/*                            Get Brand By Name                               */

const getBrandByName = async (name) => {
  return await Brand.findOne({
    name: {
      $regex: new RegExp(`^${name}$`, "i"),
    },
    deletedAt: null,
  }).lean();
};

/*                             Get All Brands                                 */

const getAllBrands = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
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

  const [brands, totalBrands] = await Promise.all([
    Brand.find(query).sort(sort).skip(skip).limit(limit).lean(),

    Brand.countDocuments(query),
  ]);

  return {
    brands,

    pagination: {
      totalBrands,
      totalPages: Math.ceil(totalBrands / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalBrands / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                          Get Featured Brands                               */

const getFeaturedBrands = async (limit = 10) => {
  return await Brand.find({
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

/*                             Search Brands                                  */

const searchBrands = async (keyword) => {
  return await Brand.find({
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
/*                              Update Brand                                  */

const updateBrand = async (
  brandId,
  updateData,
  session = null,
) => {
  return await Brand.findByIdAndUpdate(
    brandId,
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                           Toggle Featured                                  */

const toggleFeatured = async (
  brandId,
  isFeatured,
  session = null,
) => {
  return await Brand.findByIdAndUpdate(
    brandId,
    {
      isFeatured,
    },
    {
      new: true,
      session,
    },
  );
};

/*                            Toggle Active                                   */

const toggleActive = async (
  brandId,
  isActive,
  session = null,
) => {
  return await Brand.findByIdAndUpdate(
    brandId,
    {
      isActive,
    },
    {
      new: true,
      session,
    },
  );
};

/*                             Soft Delete Brand                              */

const deleteBrand = async (
  brandId,
  session = null,
) => {
  return await Brand.findByIdAndUpdate(
    brandId,
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

/*                             Restore Brand                                  */

const restoreBrand = async (
  brandId,
  session = null,
) => {
  return await Brand.findByIdAndUpdate(
    brandId,
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
  createBrand,
  getBrandById,
  getBrandBySlug,
  getBrandByName,
  getAllBrands,
  getFeaturedBrands,
  searchBrands,
  updateBrand,
  toggleFeatured,
  toggleActive,
  deleteBrand,
  restoreBrand,
};