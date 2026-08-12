import mongoose from "mongoose";
import Review from "../models/Review.model.js";

/*                              Create Review                                 */

const createReview = async (reviewData, session = null) => {
  const review = await Review.create([reviewData], {
    session,
  });

  return review[0];
};

/*                           Get Review By Id                                 */

const getReviewById = async (reviewId) => {
  return await Review.findById(reviewId)
    .populate("user", "fullName avatar")
    .populate("product", "name slug thumbnail")
    .lean();
};

/*                    Get Review By User & Product                            */

const getReviewByUserAndProduct = async (userId, productId) => {
  return await Review.findOne({
    user: userId,
    product: productId,
  }).lean();
};

/*                        Get Product Reviews                                 */

const getReviewsByProduct = async (productId, options = {}) => {
  const { page = 1, limit = 10 } = options;

  const skip = (page - 1) * limit;

  const query = {
    product: productId,
    isApproved: true,
  };

  const [reviews, totalReviews] = await Promise.all([
    Review.find(query)
      .populate("user", "fullName avatar")
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Review.countDocuments(query),
  ]);

  return {
    reviews,

    pagination: {
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalReviews / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                           Get User Reviews                                 */

const getReviewsByUser = async (userId) => {
  return await Review.find({
    user: userId,
  })
    .populate("product", "name slug thumbnail")
    .sort({
      createdAt: -1,
    })
    .lean();
};

/*                           Get All Reviews                                  */

const getAllReviews = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const [reviews, totalReviews] = await Promise.all([
    Review.find(filter)
      .populate("user", "fullName email")
      .populate("product", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Review.countDocuments(filter),
  ]);

  return {
    reviews,

    pagination: {
      totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: page,
      limit,
      hasNextPage: page < Math.ceil(totalReviews / limit),
      hasPrevPage: page > 1,
    },
  };
};

/*                           Update Review                                    */

const updateReview = async (reviewId, updateData, session = null) => {
  return await Review.findByIdAndUpdate(reviewId, updateData, {
    new: true,
    runValidators: true,
    session,
  })
    .populate("user", "fullName avatar")
    .populate("product", "name slug thumbnail");
};

/*                          Approve Review                                    */

const approveReview = async (reviewId, session = null) => {
  return await Review.findByIdAndUpdate(
    reviewId,
    {
      isApproved: true,
    },
    {
      new: true,
      session,
    },
  );
};

/*                          Delete Review                                     */

const deleteReview = async (reviewId, session = null) => {
  return await Review.findByIdAndDelete(reviewId, {
    session,
  });
};

/*                   Product Rating Statistics                                */

const getProductReviewStats = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$product",

        averageRating: {
          $avg: "$rating",
        },

        totalReviews: {
          $sum: 1,
        },

        fiveStar: {
          $sum: {
            $cond: [
              {
                $eq: ["$rating", 5],
              },
              1,
              0,
            ],
          },
        },

        fourStar: {
          $sum: {
            $cond: [
              {
                $eq: ["$rating", 4],
              },
              1,
              0,
            ],
          },
        },

        threeStar: {
          $sum: {
            $cond: [
              {
                $eq: ["$rating", 3],
              },
              1,
              0,
            ],
          },
        },

        twoStar: {
          $sum: {
            $cond: [
              {
                $eq: ["$rating", 2],
              },
              1,
              0,
            ],
          },
        },

        oneStar: {
          $sum: {
            $cond: [
              {
                $eq: ["$rating", 1],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    }
  );
};

/*                                Export                                      */

export default {
  createReview,

  getReviewById,
  getReviewByUserAndProduct,

  getReviewsByProduct,
  getReviewsByUser,
  getAllReviews,

  updateReview,
  approveReview,
  deleteReview,

  getProductReviewStats,
};
