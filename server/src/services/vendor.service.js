import slugify from "slugify";

import ApiError from "../utils/ApiError.js";

import vendorRepository from "../repositories/vendor.repository.js";
import userRepository from "../repositories/user.repository.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/*                              Helper Functions                              */

const generateShopSlug = async (
  shopName,
  ignoreId = null,
) => {
  const baseSlug = slugify(shopName, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing =
      await vendorRepository.getVendorBySlug(
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

const uploadVendorImage = async (
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

/*                              Create Vendor                                 */

const createVendor = async (vendorData, files, user) => {
  const { shopName, phone, email } = vendorData;

  if (!shopName || !phone || !email) {
    throw new ApiError(400, "Required fields are missing");
  }

  const existingUser = await userRepository.getUserById(user._id);

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const existingVendor = await vendorRepository.getVendorByUserId(user._id);

  if (existingVendor) {
    throw new ApiError(409, "Vendor profile already exists");
  }

  const shopSlug = await generateShopSlug(shopName);

  let logo = {
    url: "",
    publicId: "",
  };

  let banner = {
    url: "",
    publicId: "",
  };
  try {
    /*                        Upload Logo                        */

    if (files?.logo && files.logo.length > 0) {
      logo = await uploadVendorImage(files.logo[0]);
    }

    /*                        Upload Banner                        */

    if (files?.banner && files.banner.length > 0) {
      banner = await uploadVendorImage(files.banner[0]);
    }

    /*                        Create Vendor                        */

    const vendor = await vendorRepository.createVendor({
      ...vendorData,

      user: user._id,

      shopSlug,

      logo,

      banner,
    });

    return vendor;
  } catch (error) {
    /*                        Rollback Upload                        */

    if (logo.publicId) {
      await deleteFromCloudinary(logo.publicId);
    }

    if (banner.publicId) {
      await deleteFromCloudinary(banner.publicId);
    }

    throw error;
  }
};

/*                           Get Vendor By Id                                 */

const getVendorById = async (vendorId) => {
  const vendor = await vendorRepository.getVendorById(vendorId);

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};

/*                          Get Vendor By Slug                                */

const getVendorBySlug = async (slug) => {
  const vendor = await vendorRepository.getVendorBySlug(slug);

  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  return vendor;
};
/*                           Get All Vendors                                  */

const getAllVendors = async (
  query = {},
) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    isVerified,
    isActive,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {
    isDeleted: false,
  };

  /*                       -- Search                       -- */

  if (keyword) {
    filter.$or = [
      {
        shopName: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        ownerName: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
      {
        email: {
          $regex: keyword.trim(),
          $options: "i",
        },
      },
    ];
  }

  /*                       -- Filters                       - */

  if (
    isVerified !== undefined
  ) {
    filter.isVerified =
      isVerified === "true";
  }

  if (
    isActive !== undefined
  ) {
    filter.isActive =
      isActive === "true";
  }

  /*                       --- Sort                       --- */

  const sort = {
    [sortBy]:
      order === "asc"
        ? 1
        : -1,
  };

  return await vendorRepository.getAllVendors(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};

/*                        Get My Vendor Profile                               */

const getMyVendorProfile =
  async (userId) => {
    const vendor =
      await vendorRepository.getVendorByUserId(
        userId,
      );

    if (!vendor) {
      throw new ApiError(
        404,
        "Vendor profile not found",
      );
    }

    return vendor;
  };

/*                              Update Vendor                                 */

const updateVendor = async (
  vendorId,
  updateData,
  files,
  user,
) => {
  const vendor =
    await vendorRepository.getVendorById(
      vendorId,
    );

  if (!vendor) {
    throw new ApiError(
      404,
      "Vendor not found",
    );
  }

  /*                        Authorization                        */

  if (
    user.role !== "admin" &&
    vendor.user._id.toString() !==
      user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to update this vendor",
    );
  }

  /*                        Shop Slug                        */

  if (
    updateData.shopName &&
    updateData.shopName !== vendor.shopName
  ) {
    updateData.shopSlug =
      await generateShopSlug(
        updateData.shopName,
        vendor._id,
      );
  }

  let logo = vendor.logo;
  let banner = vendor.banner;

  /*                        Replace Logo                        */

  if (
    files?.logo?.length
  ) {
    const uploadedLogo =
      await uploadVendorImage(
        files.logo[0],
      );

    if (
      vendor.logo?.publicId
    ) {
      await deleteFromCloudinary(
        vendor.logo.publicId,
      );
    }

    logo = uploadedLogo;
  }

  /*                        Replace Banner                        */

  if (
    files?.banner?.length
  ) {
    const uploadedBanner =
      await uploadVendorImage(
        files.banner[0],
      );

    if (
      vendor.banner?.publicId
    ) {
      await deleteFromCloudinary(
        vendor.banner.publicId,
      );
    }

    banner = uploadedBanner;
  }

  updateData.logo = logo;
  updateData.banner = banner;

  return await vendorRepository.updateVendor(
    vendorId,
    updateData,
  );
};
/*                              Delete Vendor                                 */

const deleteVendor = async (
  vendorId,
  user,
) => {
  const vendor =
    await vendorRepository.getVendorById(
      vendorId,
    );

  if (!vendor) {
    throw new ApiError(
      404,
      "Vendor not found",
    );
  }

  /*                        Authorization                        */

  if (
    user.role !== "admin" &&
    vendor.user._id.toString() !==
      user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to delete this vendor",
    );
  }

  return await vendorRepository.deleteVendor(
    vendorId,
  );
};

/*                         Toggle Vendor Status                               */

const toggleVendorStatus =
  async (vendorId) => {
    const vendor =
      await vendorRepository.getVendorById(
        vendorId,
      );

    if (!vendor) {
      throw new ApiError(
        404,
        "Vendor not found",
      );
    }

    return await vendorRepository.updateVendor(
      vendorId,
      {
        isActive:
          !vendor.isActive,
      },
    );
  };

/*                           Verify Vendor                                    */

const verifyVendor = async (
  vendorId,
) => {
  const vendor =
    await vendorRepository.getVendorById(
      vendorId,
    );

  if (!vendor) {
    throw new ApiError(
      404,
      "Vendor not found",
    );
  }

  return await vendorRepository.updateVendor(
    vendorId,
    {
      isVerified: true,
      verifiedAt: new Date(),
    },
  );
};

/*                                  Export                                    */

export default {
  createVendor,

  getVendorById,

  getVendorBySlug,

  getAllVendors,

  getMyVendorProfile,

  updateVendor,

  deleteVendor,

  toggleVendorStatus,

  verifyVendor,
};