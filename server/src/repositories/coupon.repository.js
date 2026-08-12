import Coupon from "../models/Coupon.model.js";

/*                             Create Coupon                                  */

const createCoupon = async (couponData, session = null) => {
  const coupon = await Coupon.create([couponData], {
    session,
  });

  return coupon[0];
};

/*                           Get Coupon By Id                                 */

const getCouponById = async (couponId) => {
  return await Coupon.findOne({
    _id: couponId,
    deletedAt: null,
  })
    .populate("applicableCategories", "name slug")
    .populate("applicableProducts", "name slug")
    .lean();
};

/*                          Get Coupon By Code                                */

const getCouponByCode = async (code) => {
  return await Coupon.findOne({
    code: code.toUpperCase(),
    deletedAt: null,
  })
    .populate("applicableCategories", "name slug")
    .populate("applicableProducts", "name slug")
    .lean();
};

/*                            Get All Coupons                                 */

const getAllCoupons = async (filter = {}, options = {}) => {
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
    deletedAt: null,
  };

  const [coupons, totalCoupons] = await Promise.all([
    Coupon.find(query)
      .populate("applicableCategories", "name slug")
      .populate("applicableProducts", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Coupon.countDocuments(query),
  ]);

  return {
    coupons,

    pagination: {
      totalCoupons,
      totalPages: Math.ceil(totalCoupons / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalCoupons / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                        Get Active Coupons                                  */

const getActiveCoupons = async () => {
  return await Coupon.find({
    isActive: true,
    deletedAt: null,
    expiryDate: {
      $gte: new Date(),
    },
  })
    .sort({
      expiryDate: 1,
    })
    .lean();
};

/*                        Search Coupons                                      */

const searchCoupons = async (keyword) => {
  return await Coupon.find({
    deletedAt: null,

    $or: [
      {
        code: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        description: {
          $regex: keyword,
          $options: "i",
        },
      },
    ],
  }).lean();
};
/*                            Update Coupon                                   */

const updateCoupon = async (
  couponId,
  updateData,
  session = null,
) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    updateData,
    {
      new: true,
      runValidators: true,
      session,
    },
  )
    .populate("applicableCategories", "name slug")
    .populate("applicableProducts", "name slug");
};

/*                      Increment Coupon Used Count                           */

const incrementUsedCount = async (
  couponId,
  session = null,
) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    {
      $inc: {
        usedCount: 1,
      },
    },
    {
      new: true,
      session,
    },
  );
};

/*                        Toggle Coupon Status                                */

const toggleCouponStatus = async (
  couponId,
  isActive,
  session = null,
) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    {
      isActive,
    },
    {
      new: true,
      session,
    },
  );
};

/*                         Soft Delete Coupon                                 */

const deleteCoupon = async (
  couponId,
  session = null,
) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    {
      isActive: false,
      deletedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                           Restore Coupon                                   */

const restoreCoupon = async (
  couponId,
  session = null,
) => {
  return await Coupon.findByIdAndUpdate(
    couponId,
    {
      isActive: true,
      deletedAt: null,
    },
    {
      new: true,
      runValidators: true,
      session,
    },
  );
};

/*                                  Export                                    */

export default {
  createCoupon,
  getCouponById,
  getCouponByCode,
  getAllCoupons,
  getActiveCoupons,
  searchCoupons,
  updateCoupon,
  incrementUsedCount,
  toggleCouponStatus,
  deleteCoupon,
  restoreCoupon,
};