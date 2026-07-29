import slugify from "slugify";
import ApiError from "../utils/ApiError.js";
import productRepository from "../repositories/product.repository.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/*
|--------------------------------------------------------------------------
| Create Product
|--------------------------------------------------------------------------
*/

const createProduct = async (productData, files, user) => {
  const { name, price, discountPrice, stock } = productData;

  if (!name || !price || stock === undefined) {
    throw new ApiError(400, "Required fields are missing");
  }

  if (discountPrice && Number(discountPrice) > Number(price)) {
    throw new ApiError(
      400,
      "Discount price cannot be greater than actual price",
    );
  }

  const slug = slugify(name, {
    lower: true,
    strict: true,
  });

  const existingProduct = await productRepository.getProductBySlug(slug);

  if (existingProduct) {
    throw new ApiError(409, "Product already exists");
  }

  let thumbnail = {
    url: "",
    publicId: "",
  };

  if (files?.thumbnail?.length) {
    const uploadedThumbnail = await uploadOnCloudinary(files.thumbnail[0].path);

    thumbnail = {
      url: uploadedThumbnail.secure_url,
      publicId: uploadedThumbnail.public_id,
    };
  }

  const images = [];

  if (files?.images?.length) {
    for (const image of files.images) {
      const uploaded = await uploadOnCloudinary(image.path);

      images.push({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        alt: name,
      });
    }
  }

  return await productRepository.createProduct({
    ...productData,
    vendor: user._id,
    slug,
    thumbnail,
    images,
  });
};

/*
|--------------------------------------------------------------------------
| Get Product By ID
|--------------------------------------------------------------------------
*/

const getProductById = async (id) => {
  const product = await productRepository.getProductById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

/*
|--------------------------------------------------------------------------
| Get Product By Slug
|--------------------------------------------------------------------------
*/

const getProductBySlug = async (slug) => {
  const product = await productRepository.getProductBySlug(slug);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};

/*
|--------------------------------------------------------------------------
| Get All Products
|--------------------------------------------------------------------------
*/

const getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    category,
    brand,
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    order = "desc",
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
        shortDescription: {
          $regex: keyword,
          $options: "i",
        },
      },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = brand;
  }

  if (minPrice || maxPrice) {
    filter.price = {};

    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const sort = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  return await productRepository.getAllProducts(filter, {
    page: Number(page),
    limit: Number(limit),
    sort,
  });
};
/*
|--------------------------------------------------------------------------
| Update Product
|--------------------------------------------------------------------------
*/

const updateProduct = async (id, data, files, user) => {
  const product = await productRepository.getProductById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Vendor Ownership Check
  if (
    user.role !== "admin" &&
    product.vendor._id.toString() !== user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to update this product"
    );
  }

  // Price Validation
  const actualPrice = data.price || product.price;
  const discountPrice =
    data.discountPrice ?? product.discountPrice;

  if (
    discountPrice &&
    Number(discountPrice) > Number(actualPrice)
  ) {
    throw new ApiError(
      400,
      "Discount price cannot be greater than actual price"
    );
  }

  // Slug Update
  if (data.name) {
    data.slug = slugify(data.name, {
      lower: true,
      strict: true,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Replace Thumbnail
  |--------------------------------------------------------------------------
  */

  if (files?.thumbnail?.length) {
    if (product.thumbnail?.publicId) {
      await deleteFromCloudinary(
        product.thumbnail.publicId
      );
    }

    const uploadedThumbnail =
      await uploadOnCloudinary(files.thumbnail[0].path);

    data.thumbnail = {
      url: uploadedThumbnail.secure_url,
      publicId: uploadedThumbnail.public_id,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Replace Product Images
  |--------------------------------------------------------------------------
  */

  if (files?.images?.length) {
    if (product.images?.length) {
      for (const image of product.images) {
        if (image.publicId) {
          await deleteFromCloudinary(
            image.publicId
          );
        }
      }
    }

    const images = [];

    for (const image of files.images) {
      const uploaded =
        await uploadOnCloudinary(image.path);

      images.push({
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        alt: data.name || product.name,
      });
    }

    data.images = images;
  }

  return await productRepository.updateProduct(
    id,
    data
  );
};

/*
|--------------------------------------------------------------------------
| Delete Product (Soft Delete)
|--------------------------------------------------------------------------
*/

const deleteProduct = async (id, user) => {
  const product = await productRepository.getProductById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Vendor Ownership Check
  if (
    user.role !== "admin" &&
    product.vendor._id.toString() !== user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to delete this product"
    );
  }

  return await productRepository.deleteProduct(id);
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default {
  createProduct,
  getProductById,
  getProductBySlug,
  getAllProducts,
  updateProduct,
  deleteProduct,
};