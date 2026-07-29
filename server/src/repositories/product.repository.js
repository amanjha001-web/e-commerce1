import Product from "../models/Product.model.js";

/*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/

const createProduct = async (productData) => {
  return await Product.create(productData);
};

/*
|--------------------------------------------------------------------------
| Get Product By ID
|--------------------------------------------------------------------------
*/

const getProductById = async (id) => {
  return await Product.findById(id)
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("vendor", "fullName email");
};

/*
|--------------------------------------------------------------------------
| Get Product By Slug
|--------------------------------------------------------------------------
*/

const getProductBySlug = async (slug) => {
  return await Product.findOne({
    slug,
    isActive: true,
    deletedAt: null,
    status: "published",
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("vendor", "fullName email");
};

/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

const getAllProducts = async (filter = {}, options = {}) => {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

  const skip = (page - 1) * limit;

  const query = {
    ...filter,
    isActive: true,
    deletedAt: null,
    status: "published",
  };

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("vendor", "fullName email")
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalProducts / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*
|--------------------------------------------------------------------------
| Update Product
|--------------------------------------------------------------------------
*/

const updateProduct = async (id, data) => {
  return await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("vendor", "fullName email");
};

/*
|--------------------------------------------------------------------------
| Delete Product (Soft Delete)
|--------------------------------------------------------------------------
*/

const deleteProduct = async (id) => {
  return await Product.findByIdAndUpdate(
    id,
    {
      isActive: false,
      status: "archived",
      deletedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

export default {
  createProduct,
  getProductById,
  getProductBySlug,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
