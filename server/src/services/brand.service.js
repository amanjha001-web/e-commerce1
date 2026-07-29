import slugify from "slugify";
import ApiError from "../utils/ApiError.js";
import brandRepository from "../repositories/brand.repository.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/* -------------------------------------------------------------------------- */
/*                               Create Brand                                 */
/* -------------------------------------------------------------------------- */

const createBrand = async (brandData, files) => {
  const { name } = brandData;

  if (!name) {
    throw new ApiError(400, "Brand name is required");
  }

  const existingBrand = await brandRepository.getBrandByName(name);

  if (existingBrand) {
    throw new ApiError(409, "Brand already exists");
  }

  const slug = slugify(name, {
    lower: true,
    strict: true,
  });

  let logo = {
    url: "",
    publicId: "",
  };

  if (files?.image && files.image.length > 0) {
    const uploadedLogo = await uploadOnCloudinary(files.image[0].path);

    logo = {
      url: uploadedLogo.secure_url,
      publicId: uploadedLogo.public_id,
    };
  }

  return await brandRepository.createBrand({
    ...brandData,
    slug,
    logo,
  });
};

/* -------------------------------------------------------------------------- */
/*                               Get Brand By Id                              */
/* -------------------------------------------------------------------------- */

const getBrandById = async (id) => {
  const brand = await brandRepository.getBrandById(id);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  return brand;
};

/* -------------------------------------------------------------------------- */
/*                              Get Brand By Slug                             */
/* -------------------------------------------------------------------------- */

const getBrandBySlug = async (slug) => {
  const brand = await brandRepository.getBrandBySlug(slug);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  return brand;
};

/* -------------------------------------------------------------------------- */
/*                               Get All Brands                               */
/* -------------------------------------------------------------------------- */

const getAllBrands = async (query) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (keyword) {
    filter.name = {
      $regex: keyword,
      $options: "i",
    };
  }

  const sort = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  return await brandRepository.getAllBrands(filter, {
    page: Number(page),
    limit: Number(limit),
    sort,
  });
};

/* -------------------------------------------------------------------------- */
/*                               Update Brand                                 */
/* -------------------------------------------------------------------------- */

const updateBrand = async (id, data, files) => {
  const brand = await brandRepository.getBrandById(id);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  if (data.name) {
    const existingBrand = await brandRepository.getBrandByName(data.name);

    if (existingBrand && existingBrand._id.toString() !== id) {
      throw new ApiError(409, "Brand already exists");
    }

    data.slug = slugify(data.name, {
      lower: true,
      strict: true,
    });
  }

  if (files?.image && files.image.length > 0) {
    if (brand.logo?.publicId) {
      await deleteFromCloudinary(brand.logo.publicId);
    }

    const uploadedLogo = await uploadOnCloudinary(files.image[0].path);

    data.logo = {
      url: uploadedLogo.secure_url,
      publicId: uploadedLogo.public_id,
    };
  }

  return await brandRepository.updateBrand(id, data);
};

/* -------------------------------------------------------------------------- */
/*                               Delete Brand                                 */
/* -------------------------------------------------------------------------- */

const deleteBrand = async (id) => {
  const brand = await brandRepository.getBrandById(id);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  if (brand.logo?.publicId) {
    await deleteFromCloudinary(brand.logo.publicId);
  }

  return await brandRepository.deleteBrand(id);
};

export default {
  createBrand,
  getBrandById,
  getBrandBySlug,
  getAllBrands,
  updateBrand,
  deleteBrand,
};
