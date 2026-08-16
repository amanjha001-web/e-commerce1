import Banner from "../models/Banner.model.js";

/* ============================ Create Banner ============================ */

const createBanner = async (bannerData, session = null) => {
  const [banner] = await Banner.create([bannerData], {
    session,
  });

  return banner;
};

/* ========================== Find Banner By Id ========================== */

const findBannerById = async (bannerId) => {
  return Banner.findOne({
    _id: bannerId,
    isDeleted: false,
  })
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email");
};

/* ========================= Find Banner By Slug ========================= */

const findBannerBySlug = async (slug) => {
  return Banner.findOne({
    slug: slug.toLowerCase(),
    isDeleted: false,
  });
};

/* ========================== Find Active Banners ======================= */

const findActiveBanners = async (filter = {}) => {
  const now = new Date();

  return Banner.find({
    isDeleted: false,

    status: "ACTIVE",

    $and: [
      {
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
      },

      {
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
      },
    ],

    ...filter,
  }).sort({
    position: 1,
    createdAt: -1,
  });
};

/* ============================ Find Banners ============================= */

const findBanners = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      position: 1,
      createdAt: -1,
    },
  } = options;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 20;

  const skip = (pageNumber - 1) * limitNumber;

  const query = {
    isDeleted: false,
    ...filter,
  };

  const [banners, total] = await Promise.all([
    Banner.find(query)
      .populate("createdBy", "fullName email")
      .populate("updatedBy", "fullName email")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber),

    Banner.countDocuments(query),
  ]);

  return {
    banners,

    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      hasNextPage: pageNumber < Math.ceil(total / limitNumber),
      hasPrevPage: pageNumber > 1,
    },
  };
};

/* ============================ Update Banner ============================ */

const updateBanner = async (bannerId, updateData, session = null) => {
  return Banner.findOneAndUpdate(
    {
      _id: bannerId,
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  )
    .populate("createdBy", "fullName email")
    .populate("updatedBy", "fullName email");
};

/* ======================== Update Banner By Slug ======================== */

const updateBannerBySlug = async (slug, updateData) => {
  return Banner.findOneAndUpdate(
    {
      slug: slug.toLowerCase(),
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

/* =========================== Increment Click ========================== */

const incrementClick = async (bannerId) => {
  return Banner.findOneAndUpdate(
    {
      _id: bannerId,
      isDeleted: false,
    },
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

/* ======================== Increment Impression ======================= */

const incrementImpression = async (bannerId) => {
  return Banner.findOneAndUpdate(
    {
      _id: bannerId,
      isDeleted: false,
    },
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

/* ============================ Soft Delete ============================= */

const softDeleteBanner = async (bannerId) => {
  return Banner.findOneAndUpdate(
    {
      _id: bannerId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      status: "INACTIVE",
    },
    {
      new: true,
    },
  );
};

/* ============================= Count Banners ========================== */

const countBanners = async (filter = {}) => {
  return Banner.countDocuments({
    isDeleted: false,
    ...filter,
  });
};

/* ================================ Export =============================== */

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
