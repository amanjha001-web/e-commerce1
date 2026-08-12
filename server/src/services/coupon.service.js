import ApiError from "../utils/ApiError.js";

import couponRepository from "../repositories/coupon.repository.js";


/*                               Helper Functions                             */


const validateCouponData = async (data, ignoreId = null) => {
  const {
    code,
    discountType,
    discountValue,
    minimumOrderAmount,
    maximumDiscount,
    startDate,
    expiryDate,
    usageLimit,
  } = data;

  if (!code?.trim()) {
    throw new ApiError(400, "Coupon code is required");
  }

  const existingCoupon = await couponRepository.getCouponByCode(
    code.trim().toUpperCase(),
  );

  if (
    existingCoupon &&
    (!ignoreId || existingCoupon._id.toString() !== ignoreId.toString())
  ) {
    throw new ApiError(409, "Coupon code already exists");
  }

  if (!["percentage", "fixed"].includes(discountType)) {
    throw new ApiError(400, "Invalid discount type");
  }

  if (Number(discountValue) <= 0) {
    throw new ApiError(400, "Discount value must be greater than zero");
  }

  if (discountType === "percentage" && Number(discountValue) > 100) {
    throw new ApiError(400, "Percentage discount cannot exceed 100%");
  }

  if (Number(minimumOrderAmount) < 0) {
    throw new ApiError(400, "Invalid minimum order amount");
  }

  if (Number(maximumDiscount) < 0) {
    throw new ApiError(400, "Invalid maximum discount");
  }

  if (Number(usageLimit) < 1) {
    throw new ApiError(400, "Usage limit must be at least 1");
  }

  if (new Date(startDate) >= new Date(expiryDate)) {
    throw new ApiError(400, "Expiry date must be after start date");
  }
};


/*                             Create Coupon                                  */


const createCoupon = async (couponData) => {
  await validateCouponData(couponData);

  return await couponRepository.createCoupon({
    ...couponData,
    code: couponData.code.trim().toUpperCase(),
  });
};

/*                            Get All Coupons                                 */


const getAllCoupons = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    keyword = "",
    isActive,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const filter = {};

  if (keyword) {
    filter.code = {
      $regex: keyword.trim(),
      $options: "i",
    };
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const sort = {
    [sortBy]: order === "asc" ? 1 : -1,
  };

  return await couponRepository.getAllCoupons(
    filter,
    {
      page: Number(page),
      limit: Number(limit),
      sort,
    },
  );
};


/*                           Get Coupon By Code                               */


const getCouponByCode = async (
  code,
) => {
  const coupon =
    await couponRepository.getCouponByCode(
      code.trim().toUpperCase(),
    );

  if (!coupon) {
    throw new ApiError(
      404,
      "Coupon not found",
    );
  }

  if (!coupon.isActive) {
    throw new ApiError(
      400,
      "Coupon is inactive",
    );
  }

  return coupon;
};


/*                             Apply Coupon                                   */


const applyCoupon = async (
  code,
  orderAmount,
) => {
  const coupon =
    await getCouponByCode(code);

  const now = new Date();

  if (now < coupon.startDate) {
    throw new ApiError(
      400,
      "Coupon is not active yet",
    );
  }

  if (now > coupon.expiryDate) {
    throw new ApiError(
      400,
      "Coupon has expired",
    );
  }

  if (
    coupon.usedCount >=
    coupon.usageLimit
  ) {
    throw new ApiError(
      400,
      "Coupon usage limit exceeded",
    );
  }

  if (
    orderAmount <
    coupon.minimumOrderAmount
  ) {
    throw new ApiError(
      400,
      `Minimum order amount is ₹${coupon.minimumOrderAmount}`,
    );
  }

  let discount = 0;

  if (
    coupon.discountType ===
    "percentage"
  ) {
    discount =
      (orderAmount *
        coupon.discountValue) /
      100;

    if (
      coupon.maximumDiscount > 0 &&
      discount >
        coupon.maximumDiscount
    ) {
      discount =
        coupon.maximumDiscount;
    }
  } else {
    discount =
      coupon.discountValue;
  }

  discount = Math.min(
    discount,
    orderAmount,
  );

  return {
    coupon,
    discount,
    finalAmount:
      orderAmount - discount,
  };
};

/*                             Update Coupon                                  */


const updateCoupon = async (
  couponId,
  updateData,
) => {
  const coupon =
    await couponRepository.getCouponById(
      couponId,
    );

  if (!coupon) {
    throw new ApiError(
      404,
      "Coupon not found",
    );
  }

  if (updateData.code) {
    updateData.code =
      updateData.code.trim().toUpperCase();
  }

  await validateCouponData(
    {
      ...coupon.toObject(),
      ...updateData,
    },
    couponId,
  );

  return await couponRepository.updateCoupon(
    couponId,
    updateData,
  );
};


/*                             Delete Coupon                                  */


const deleteCoupon = async (
  couponId,
) => {
  const coupon =
    await couponRepository.getCouponById(
      couponId,
    );

  if (!coupon) {
    throw new ApiError(
      404,
      "Coupon not found",
    );
  }

  return await couponRepository.deleteCoupon(
    couponId,
  );
};


/*                         Toggle Coupon Status                               */


const toggleCouponStatus =
  async (couponId) => {
    const coupon =
      await couponRepository.getCouponById(
        couponId,
      );

    if (!coupon) {
      throw new ApiError(
        404,
        "Coupon not found",
      );
    }

    return await couponRepository.updateCoupon(
      couponId,
      {
        isActive:
          !coupon.isActive,
      },
    );
  };


/*                                  Export                                    */


export default {
  createCoupon,
  getAllCoupons,
  getCouponByCode,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
};