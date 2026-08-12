import Banner from "../models/Banner.model.js";

/*                             Create Banner                                  */

const createBanner = async (bannerData, session = null) => {
  const [banner] = await Banner.create([bannerData], {
    session,
  });

  return banner;
};

/*                           Find Banner By Id                                */

const findBannerById = async (bannerId) => {
  return Banner.findOne({
    _id: bannerId,
    isDeleted: false,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");
};

/*                          Find Banner By Slug                               */

const findBannerBySlug = async (slug) => {
  return Banner.findOne({
    slug,
    isDeleted: false,
  });
};

/*                          Find Active Banner                                */

const findActiveBanners = async (filter = {}) => {
  const now = new Date();

  return Banner.find({
    isDeleted: false,
    status: "ACTIVE",
    $or: [
      {
        startDate: null,
      },
      {
        startDate: {
          $lte: now,
        },
      },
    ],
    $or: [
      {
        endDate: null,
      },
      {
        endDate: {
          $gte: now,
        },
      },
    ],
    ...filter,
  }).sort({
    position: 1,
  });
};

/*                           Find All Banners                                 */

const findBanners = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      position: 1,
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const banners = await Banner.find({
    isDeleted: false,
    ...filter,
  })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Banner.countDocuments({
    isDeleted: false,
    ...filter,
  });

  return {
    banners,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                           Update Banner                                    */

const updateBanner = async (bannerId, updateData, session = null) => {
  return Banner.findByIdAndUpdate(bannerId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                         Update Banner By Slug                              */

const updateBannerBySlug = async (slug, updateData) => {
  return Banner.findOneAndUpdate(
    {
      slug,
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                           Increment Click                                  */

const incrementClick = async (bannerId) => {
  return Banner.findByIdAndUpdate(
    bannerId,
    {
      $inc: {
        clickCount: 1,
      },
    },
    {
      new: true,
    },
  );
};

/*                       Increment Impression                                 */

const incrementImpression = async (bannerId) => {
  return Banner.findByIdAndUpdate(
    bannerId,
    {
      $inc: {
        impressionCount: 1,
      },
    },
    {
      new: true,
    },
  );
};

/*                           Soft Delete                                      */

const softDeleteBanner = async (bannerId) => {
  return Banner.findByIdAndUpdate(
    bannerId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                           Count Banners                                    */

const countBanners = async (filter = {}) => {
  return Banner.countDocuments({
    isDeleted: false,
    ...filter,
  });
};

export default {
  createBanner,
  findBannerById,
  findBannerBySlug,
  findActiveBanners,
  findBanners,
  updateBanner,
  updateBannerBySlug,
  incrementClick,
  incrementImpression,
  softDeleteBanner,
  countBanners,
};
