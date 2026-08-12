import slugify from "slugify";

import ApiError from "../utils/ApiError.js";

import productRepository from "../repositories/product.repository.js";
import brandRepository from "../repositories/brand.repository.js";
import categoryRepository from "../repositories/category.repository.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/*                              Helper Functions                              */

const generateSlug = async (
  name,
  ignoreId = null,
) => {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing =
      await productRepository.getProductBySlug(
        slug,
      );

    if (
      !existing ||
      (ignoreId &&
        existing._id.toString() ===
          ignoreId.toString())
    ) {
      break;
    }

    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

const uploadThumbnail = async (
  file,
) => {
  const uploaded =
    await uploadOnCloudinary(
      file.path,
    );

  return {
    url: uploaded.secure_url,
    publicId:
      uploaded.public_id,
  };
};

const uploadImages =
  async (files = [], alt) => {
    const images = [];

    for (const file of files) {
      const uploaded =
        await uploadOnCloudinary(
          file.path,
        );

      images.push({
        url: uploaded.secure_url,
        publicId:
          uploaded.public_id,
        alt,
      });
    }

    return images;
  };

const removeImages =
  async (images = []) => {
    for (const image of images) {
      if (image.publicId) {
        await deleteFromCloudinary(
          image.publicId,
        );
      }
    }
  };

/*                              Create Product                                */

const createProduct = async (productData, files, user) => {
  const { name, category, brand, price, discountPrice, stock } = productData;

  if (!name || !category || !brand) {
    throw new ApiError(400, "Required fields are missing");
  }

  if (Number(price) <= 0) {
    throw new ApiError(400, "Invalid product price");
  }

  if (Number(stock) < 0) {
    throw new ApiError(400, "Invalid stock quantity");
  }

  if (discountPrice && Number(discountPrice) > Number(price)) {
    throw new ApiError(400, "Discount price cannot exceed actual price");
  }

  const existingCategory = await categoryRepository.getCategoryById(category);

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  const existingBrand = await brandRepository.getBrandById(brand);

  if (!existingBrand) {
    throw new ApiError(404, "Brand not found");
  }

  const slug = await generateSlug(name);
  let thumbnail = {
    url: "",
    publicId: "",
  };

  let images = [];

  try {
    /*               Upload Thumbnail               */

    if (files?.thumbnail && files.thumbnail.length > 0) {
      thumbnail = await uploadThumbnail(files.thumbnail[0]);
    }

    /*                        Upload Images                     */

    if (files?.images && files.images.length > 0) {
      images = await uploadImages(files.images, name);
    }

    /*                        Create Product                        */

    const product = await productRepository.createProduct({
      ...productData,

      vendor: user._id,

      slug,

      thumbnail,

      images,
    });

    return product;
  } catch (error) {
    /*                        Rollback Upload                        */

    if (thumbnail.publicId) {
      await deleteFromCloudinary(thumbnail.publicId);
    }

    await removeImages(images);

    throw error;
  }
};

/*                            Get Product By Id                               */

const getProductById = async (productId) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

/*                           Get Product By Slug                              */

const getProductBySlug = async (slug) => {
  const product = await productRepository.getProductBySlug(slug);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};
/*                            Get All Products                                */

const getAllProducts = async (
  query = {},
) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    category,
    brand,
    vendor,
    minPrice,
    maxPrice,
    featured,
    inStock,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {
    isActive: true,
    deletedAt: null,
  };

  /*                          Search                          */

  if (keyword) {
    filter.$or = [
      {
        name: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        shortDescription: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        description: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        sku: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
    ];
  }

  /*                        Filters                          */

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = brand;
  }

  if (vendor) {
    filter.vendor = vendor;
  }

  if (featured !== undefined) {
    filter.featured =
      featured === "true";
  }

  if (inStock === "true") {
    filter.stock = {
      $gt: 0,
    };
  }

  /*                            Price Range                       */

  if (
    minPrice ||
    maxPrice
  ) {
    filter.price = {};

    if (minPrice) {
      filter.price.$gte =
        Number(minPrice);
    }

    if (maxPrice) {
      filter.price.$lte =
        Number(maxPrice);
    }
  }

  /*                Sort             */

  const sort = {
    [sortBy]:
      order === "asc"
        ? 1
        : -1,
  };

  return await productRepository.getAllProducts(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};

/*                         Get Products By Vendor                             */

const getVendorProducts = async (
  vendorId,
  query = {},
) => {
  return await getAllProducts({
    ...query,
    vendor: vendorId,
  });
};
/*                              Update Product                                */

const updateProduct = async (productId, updateData, files, user) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  /*                        Authorization                        */

  if (
    user.role !== "admin" &&
    product.vendor._id.toString() !== user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to update this product");
  }

  /*                        Category Validation                        */

  if (updateData.category) {
    const category = await categoryRepository.getCategoryById(
      updateData.category,
    );

    if (!category) {
      throw new ApiError(404, "Category not found");
    }
  }

  /*                        Brand Validation                        */

  if (updateData.brand) {
    const brand = await brandRepository.getBrandById(updateData.brand);

    if (!brand) {
      throw new ApiError(404, "Brand not found");
    }
  }

  /*                        Price Validation                        */

  const actualPrice = Number(updateData.price ?? product.price);

  const discountPrice = Number(
    updateData.discountPrice ?? product.discountPrice,
  );

  if (discountPrice > actualPrice) {
    throw new ApiError(400, "Discount price cannot exceed actual price");
  }

  /*                        Slug                        */

  if (updateData.name && updateData.name !== product.name) {
    updateData.slug = await generateSlug(updateData.name, product._id);
  }

  let thumbnail = product.thumbnail;

  let images = product.images;

  /*                        Thumbnail                        */

  if (files?.thumbnail?.length) {
    if (product.thumbnail?.publicId) {
      await deleteFromCloudinary(product.thumbnail.publicId);
    }

    thumbnail = await uploadThumbnail(files.thumbnail[0]);
  }

  /*                        Images                        */

  if (files?.images?.length) {
    await removeImages(product.images);

    images = await uploadImages(files.images, updateData.name || product.name);
  }

  updateData.thumbnail = thumbnail;

  updateData.images = images;
  /*                        Save Product                        */

  const updatedProduct = await productRepository.updateProduct(
    productId,
    updateData,
  );

  return updatedProduct;
};

/*                             Delete Product                                 */

const deleteProduct = async (productId, user) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (
    user.role !== "admin" &&
    product.vendor._id.toString() !== user._id.toString()
  ) {
    throw new ApiError(403, "You are not authorized to delete this product");
  }

  return await productRepository.deleteProduct(productId);
};

/*                            Restore Product                                 */

const restoreProduct = async (productId) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return await productRepository.updateProduct(productId, {
    deletedAt: null,
    isActive: true,
    status: "draft",
  });
};

/*                           Toggle Product Status                            */

const toggleProductStatus = async (productId) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return await productRepository.updateProduct(productId, {
    isActive: !product.isActive,
  });
};

/*                           Update Product Stock                             */

const updateProductStock = async (productId, stock) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (stock < 0) {
    throw new ApiError(400, "Stock cannot be negative");
  }

  return await productRepository.updateProduct(productId, {
    stock,
  });
};

/*                         Flash Sale Products                                */

const getFlashSaleProducts = async (limit = 10) => {
  return await productRepository.getFlashSaleProducts(
    Number(limit),
  );
};

/*                           Trending Products                                */

const getTrendingProducts = async (limit = 10) => {
  return await productRepository.getTrendingProducts(
    Number(limit),
  );
};

/*                         Best Seller Products                               */

const getBestSellerProducts = async (limit = 10) => {
  return await productRepository.getBestSellerProducts(Number(limit));
};

/*                                  Export                                    */

export default {
  createProduct,

  getProductById,

  getProductBySlug,

  getAllProducts,

  getVendorProducts,

  updateProduct,

  deleteProduct,

  restoreProduct,

  toggleProductStatus,

  updateProductStock,

  getFlashSaleProducts,

  getTrendingProducts,

  getBestSellerProducts,
};