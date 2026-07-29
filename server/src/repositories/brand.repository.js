import Brand from "../models/Brand.model.js";

const createBrand = async (brandData) => {
  return await Brand.create(brandData);
};

const getBrandById = async (id) => {
  return await Brand.findById(id);
};

const getBrandBySlug = async (slug) => {
  return await Brand.findOne({ slug });
};

const getBrandByName = async (name) => {
  return await Brand.findOne({
    name: {
      $regex: new RegExp(`^${name}$`, "i"),
    },
  });
};

const getAllBrands = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const brands = await Brand.find({
    ...filter,
    deletedAt: null,
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Brand.countDocuments({
    ...filter,
    deletedAt: null,
  });

  return {
    brands,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const updateBrand = async (id, data) => {
  return await Brand.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteBrand = async (id) => {
  return await Brand.findByIdAndUpdate(
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
  createBrand,
  getBrandById,
  getBrandBySlug,
  getBrandByName,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
