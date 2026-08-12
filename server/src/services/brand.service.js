import generateSlug from "../utils/generateSlug.js";
import ApiError from "../utils/ApiError.js";

import brandRepository from "../repositories/brand.repository.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";


/*                              Helper Functions                              */





const uploadLogo = async (file) => {
  if (!file) {
    return {
      url: "",
      publicId: "",
    };
  }

  const uploaded = await uploadOnCloudinary(file.path);

  if (!uploaded?.secure_url) {
    throw new ApiError(500, "Failed to upload brand logo");
  }

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

const removeLogo = async (publicId) => {
  if (!publicId) return;

  try {
    await deleteFromCloudinary(publicId);
  } catch (error) {
    console.error("Cloudinary Delete Error:", error.message);
  }
};


/*                             Create Brand                                   */


const createBrand = async (brandData, files) => {
  const { name, description, website, isFeatured, isActive } = brandData;
 

  if (!name?.trim()) {
    throw new ApiError(400, "Brand name is required");
  }

  const existingBrand = await brandRepository.getBrandByName(name.trim());

  const slug = await generateSlug(name.trim(), brandRepository.getBrandBySlug);

  if (existingBrand && !existingBrand.deletedAt) {
    throw new ApiError(409, "Brand already exists");
  }

  let logo = {
    url: "",
    publicId: "",
  };

  try {
    if (files?.image && files.image.length > 0) {
      logo = await uploadLogo(files.image[0]);
    }

    const brand = await brandRepository.createBrand({
      name: name.trim(),
      slug,
      description: description?.trim() || "",
      website: website?.trim() || "",
      logo,
      isFeatured: isFeatured ?? false,
      isActive: isActive ?? true,
    });

    return brand;
  } catch (error) {
    if (logo.publicId) {
      await removeLogo(logo.publicId);
    }

    throw error;
  }
};

/*                             Get Brand By Id                                */


const getBrandById = async (brandId) => {
  const brand = await brandRepository.getBrandById(brandId);

  if (!brand || brand.deletedAt) {
    throw new ApiError(404, "Brand not found");
  }

  return brand;
};


/*                            Get Brand By Slug                               */


const getBrandBySlug = async (slug) => {
  const brand = await brandRepository.getBrandBySlug(slug);

  if (!brand || brand.deletedAt) {
    throw new ApiError(404, "Brand not found");
  }

  return brand;
};


/*                             Get All Brands                                 */


const getAllBrands = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    isFeatured,
    isActive,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (keyword?.trim()) {
    filter.$or = [
      {
        name: {
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
    ];
  }

  if (typeof isFeatured !== "undefined") {
    filter.isFeatured = isFeatured === "true";
  }

  if (typeof isActive !== "undefined") {
    filter.isActive = isActive === "true";
  }

  const allowedSortFields = ["name", "createdAt", "updatedAt"];

  const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const sort = {
    [sortField]: order === "asc" ? 1 : -1,
  };

  return await brandRepository.getAllBrands(filter, {
    page: Number(page),
    limit: Number(limit),
    sort,
  });
};

/*                              Update Brand                                  */


const updateBrand = async (brandId, updateData, files) => {
  const brand = await brandRepository.getBrandById(brandId);
  

  if (!brand || brand.deletedAt) {
    throw new ApiError(404, "Brand not found");
  }

  const data = {
    ...updateData,
  };

  
  /*                          Duplicate Brand Check                         */
  

  if (data.name && data.name.trim() !== brand.name) {
    const existingBrand = await brandRepository.getBrandByName(
      data.name.trim(),
    );

    if (existingBrand && existingBrand._id.toString() !== brandId.toString()) {
      throw new ApiError(409, "Brand already exists");
    }

    data.name = data.name.trim();

    data.slug = await generateSlug(
      data.name,
      brandRepository.getBrandBySlug,
      brandId,
    );
  }

  
  /*                            Trim String Fields                          */
  

  if (data.description !== undefined) {
    data.description = data.description?.trim() || "";
  }

  if (data.website !== undefined) {
    data.website = data.website?.trim() || "";
  }

  
  /*                           Replace Brand Logo                           */
  

  let uploadedLogo = null;

  try {
    if (files?.image && files.image.length > 0) {
      uploadedLogo = await uploadLogo(files.image[0]);

      data.logo = uploadedLogo;
    }

    const updatedBrand = await brandRepository.updateBrand(brandId, data);

    if (uploadedLogo && brand.logo?.publicId) {
      await removeLogo(brand.logo.publicId);
    }

    return updatedBrand;
  } catch (error) {
    if (uploadedLogo?.publicId) {
      await removeLogo(uploadedLogo.publicId);
    }

    throw error;
  }
};

/*                              Delete Brand                                  */


const deleteBrand = async (brandId) => {
  const brand = await brandRepository.getBrandById(brandId);

  if (!brand || brand.deletedAt) {
    throw new ApiError(404, "Brand not found");
  }

  return await brandRepository.deleteBrand(brandId);
};


/*                              Restore Brand                                 */


const restoreBrand = async (brandId) => {
  const brand = await brandRepository.getBrandById(brandId);

  if (!brand) {
    throw new ApiError(404, "Brand not found");
  }

  if (!brand.deletedAt) {
    throw new ApiError(400, "Brand is already active");
  }

  return await brandRepository.updateBrand(brandId, {
    deletedAt: null,
    isActive: true,
  });
};


/*                           Toggle Brand Status                              */


const toggleBrandStatus = async (brandId) => {
  const brand = await brandRepository.getBrandById(brandId);

  if (!brand || brand.deletedAt) {
    throw new ApiError(404, "Brand not found");
  }

  return await brandRepository.updateBrand(brandId, {
    isActive: !brand.isActive,
  });
};


/*                                  Export                                    */


export default {
  createBrand,
  getBrandById,
  getBrandBySlug,
  getAllBrands,
  updateBrand,
  deleteBrand,
  restoreBrand,
  toggleBrandStatus,
};
