import Product from "../models/Product.model.js";

/*                              Create Product                                */

const createProduct = async (productData, session = null) => {
  const product = await Product.create([productData], {
    session,
  });

  return product[0];
};

/*                           Get Product By Id                                */

const getProductById = async (productId) => {
  return await Product.findById(productId)
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("vendor", "fullName email")
    .lean();
};

/*                         Get Product By Slug                                */

const getProductBySlug = async (slug) => {
  return await Product.findOne({
    slug,
    isActive: true,
    deletedAt: null,
    status: "published",
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("vendor", "fullName email")
    .lean();
};

/*                          Get Product By SKU                                */

const getProductBySku = async (sku) => {
  return await Product.findOne({
    sku,
    deletedAt: null,
  }).lean();
};

/*                           Get All Products                                 */

const getAllProducts = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const query = {
    ...filter,
    isActive: true,
    deletedAt: null,
  };

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("vendor", "fullName email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

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

/*                        Get Vendor Products                                 */

const getVendorProducts = async (vendorId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;

  const query = {
    vendor: vendorId,
    deletedAt: null,
  };

  const [products, totalProducts] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

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

/*                           Update Product                                   */

const updateProduct = async (productId, updateData, session = null) => {
  return await Product.findByIdAndUpdate(productId, updateData, {
    new: true,
    runValidators: true,
    session,
  })
    .populate("category", "name slug")
    .populate("brand", "name slug")
    .populate("vendor", "fullName email");
};
/*                     Soft Delete Product                                    */

const deleteProduct = async (
  productId,
  session = null,
) => {
  return await Product.findByIdAndUpdate(
    productId,
    {
      isActive: false,
      status: "archived",
      deletedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                  Update Product Stock & Sold                               */

const updateProductStock = async (
  productId,
  quantity,
  session = null,
) => {
  return await Product.findByIdAndUpdate(
    productId,
    {
      $inc: {
        stock: -quantity,
        sold: quantity,
      },
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                    Update Product Rating                                   */

const updateProductRating = async (
  productId,
  averageRating,
  totalReviews,
  session = null,
) => {
  return await Product.findByIdAndUpdate(
    productId,
    {
      averageRating,
      totalReviews,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                        Search Products                                     */

const searchProducts = async (
  keyword,
  options = {},
) => {
  const {
    page = 1,
    limit = 10,
  } = options;

  const skip = (page - 1) * limit;

  const query = {
    deletedAt: null,
    isActive: true,
    status: "published",
    $text: {
      $search: keyword,
    },
  };

  const [products, totalProducts] =
    await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .populate("brand", "name slug")
        .populate("vendor", "fullName email")
        .sort({
          score: {
            $meta: "textScore",
          },
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(query),
    ]);

  return {
    products,

    pagination: {
      totalProducts,
      totalPages: Math.ceil(
        totalProducts / limit,
      ),
      currentPage: page,
      limit,
      hasNextPage:
        page <
        Math.ceil(totalProducts / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                    Featured Products                                       */

const getFeaturedProducts = async (
  limit = 10,
) => {
  return await Product.find({
    featured: true,
    isActive: true,
    status: "published",
    deletedAt: null,
  })
    .populate("category", "name")
    .populate("brand", "name")
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .lean();
};

/*                    Flash Sale Products                                     */

const getFlashSaleProducts = async (
  limit = 10,
) => {
  return await Product.find({
    flashSale: true,
    isActive: true,
    status: "published",
    deletedAt: null,
  })
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .lean();
};

/*                    Trending Products                                       */

const getTrendingProducts = async (
  limit = 10,
) => {
  return await Product.find({
    trending: true,
    isActive: true,
    status: "published",
    deletedAt: null,
  })
    .sort({
      sold: -1,
    })
    .limit(limit)
    .lean();
};

/*                    Best Seller Products                                    */

const getBestSellerProducts = async (
  limit = 10,
) => {
  return await Product.find({
    bestSeller: true,
    isActive: true,
    status: "published",
    deletedAt: null,
  })
    .sort({
      sold: -1,
    })
    .limit(limit)
    .lean();
};

/*                    New Arrival Products                                    */

const getNewArrivalProducts = async (
  limit = 10,
) => {
  return await Product.find({
    newArrival: true,
    isActive: true,
    status: "published",
    deletedAt: null,
  })
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .lean();
};

/*                      Count Products                                        */

const countProducts = async (
  filter = {},
) => {
  return await Product.countDocuments({
    ...filter,
    deletedAt: null,
  });
};

/*                                Export                                      */

export default {
  createProduct,

  getProductById,
  getProductBySlug,
  getProductBySku,

  getAllProducts,
  getVendorProducts,

  updateProduct,

  deleteProduct,

  updateProductStock,
  updateProductRating,

  searchProducts,

  getFeaturedProducts,
  getFlashSaleProducts,
  getTrendingProducts,
  getBestSellerProducts,
  getNewArrivalProducts,

  countProducts,
};