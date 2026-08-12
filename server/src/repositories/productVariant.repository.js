import ProductVariant from "../models/ProductVariant.model.js";

/*                         Create Variant                                     */

const createVariant = async (variantData, session = null) => {
  const options = session ? { session } : {};

  const [variant] = await ProductVariant.create([variantData], options);

  return variant;
};

/*                         Find Variant By ID                                 */

const findById = async (variantId) => {
  return ProductVariant.findById(variantId);
};

/*                    Find Variant With Product                               */

const findByIdWithProduct = async (variantId) => {
  return ProductVariant.findById(variantId).populate("product");
};

/*                    Find Product Variants                                   */

const findByProductId = async (productId, options = {}) => {
  const { includeDeleted = false } = options;

  const filter = {
    product: productId,
  };

  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  return ProductVariant.find(filter).sort({
    createdAt: -1,
  });
};

/*                         Search Variants                                    */

const searchVariants = async (filter = {}, options = {}) => {
  const { skip = 0, limit = 10 } = options;

  return ProductVariant.find({
    ...filter,
    isDeleted: false,
  })
    .skip(skip)
    .limit(limit)
    .sort({
      createdAt: -1,
    });
};

/*                         Count Variants                                     */

const countVariants = async (filter = {}) => {
  return ProductVariant.countDocuments({
    ...filter,
    isDeleted: false,
  });
};

/*                         Update Variant                                     */

const updateVariant = async (variantId, updateData, session = null) => {
  const options = {
    new: true,
  };

  if (session) {
    options.session = session;
  }

  return ProductVariant.findByIdAndUpdate(variantId, updateData, options);
};

/*                         Update Stock                                       */

const updateStock = async (variantId, stock, session = null) => {
  const options = {
    new: true,
  };

  if (session) {
    options.session = session;
  }

  return ProductVariant.findByIdAndUpdate(
    variantId,
    {
      stock,
    },
    options,
  );
};

/*                       Increase Stock                                       */

const increaseStock = async (variantId, quantity, session = null) => {
  const options = {};

  if (session) {
    options.session = session;
  }

  return ProductVariant.findByIdAndUpdate(
    variantId,
    {
      $inc: {
        stock: quantity,
      },
    },
    {
      new: true,
      ...options,
    },
  );
};

/*                       Decrease Stock                                       */

const decreaseStock = async (variantId, quantity, session = null) => {
  const options = {};

  if (session) {
    options.session = session;
  }

  return ProductVariant.findOneAndUpdate(
    {
      _id: variantId,
      stock: {
        $gte: quantity,
      },
    },

    {
      $inc: {
        stock: -quantity,
      },
    },

    {
      new: true,
      ...options,
    },
  );
};

/*                         Reserve Stock                                      */

const reserveStock = async (variantId, quantity, session = null) => {
  const options = {};

  if (session) {
    options.session = session;
  }

  return ProductVariant.findOneAndUpdate(
    {
      _id: variantId,

      $expr: {
        $gte: [
          {
            $subtract: ["$stock", "$reservedStock"],
          },
          quantity,
        ],
      },
    },

    {
      $inc: {
        reservedStock: quantity,
      },
    },

    {
      new: true,
      ...options,
    },
  );
};

/*                         Release Stock                                      */

const releaseStock = async (variantId, quantity, session = null) => {
  const options = {};

  if (session) {
    options.session = session;
  }

  return ProductVariant.findByIdAndUpdate(
    variantId,

    {
      $inc: {
        reservedStock: -quantity,
      },
    },

    {
      new: true,
      ...options,
    },
  );
};

/*                         Soft Delete                                       */

const softDelete = async (variantId) => {
  return ProductVariant.findByIdAndUpdate(
    variantId,

    {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false,
    },

    {
      new: true,
    },
  );
};

/*                         Restore Variant                                    */

const restore = async (variantId) => {
  return ProductVariant.findByIdAndUpdate(
    variantId,

    {
      isDeleted: false,
      deletedAt: null,
      isActive: true,
    },

    {
      new: true,
    },
  );
};

/*                         SKU Check                                          */

const findBySku = async (sku) => {
  return ProductVariant.findOne({
    sku,
    isDeleted: false,
  });
};

export default {
  createVariant,

  findById,

  findByIdWithProduct,

  findByProductId,

  searchVariants,

  countVariants,

  updateVariant,

  updateStock,

  increaseStock,

  decreaseStock,

  reserveStock,

  releaseStock,

  softDelete,

  restore,

  findBySku,
};
