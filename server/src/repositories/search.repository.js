import Product from "../models/Product.model.js";
import SearchHistory from "../models/SearchHistory.model.js";

/* ============================================================================
   PRODUCT SEARCH
============================================================================ */

const searchProducts = async ({
  keyword = "",
  category,
  brand,
  minPrice,
  maxPrice,
  page = 1,
  limit = 10,
  sort = "relevance",
} = {}) => {
  const filter = {
    isActive: true,
    status: "published",
    deletedAt: null,
  };

  /* ------------------------------------------------------------------------
     Keyword Search
  ------------------------------------------------------------------------ */

  if (keyword?.trim()) {
    filter.$text = {
      $search: keyword.trim(),
    };
  }

  /* ------------------------------------------------------------------------
     Category Filter
  ------------------------------------------------------------------------ */

  if (category) {
    filter.category = category;
  }

  /* ------------------------------------------------------------------------
     Brand Filter
  ------------------------------------------------------------------------ */

  if (brand) {
    filter.brand = brand;
  }

  /* ------------------------------------------------------------------------
     Price Filter
  ------------------------------------------------------------------------ */

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  /* ------------------------------------------------------------------------
     Pagination
  ------------------------------------------------------------------------ */

  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 10;

  const skip = (currentPage - 1) * currentLimit;

  /* ------------------------------------------------------------------------
     Sorting
  ------------------------------------------------------------------------ */

  let sortQuery = {};

  switch (sort) {
    case "price_asc":
      sortQuery = { price: 1 };
      break;

    case "price_desc":
      sortQuery = { price: -1 };
      break;

    case "rating":
      sortQuery = { averageRating: -1 };
      break;

    case "newest":
      sortQuery = { createdAt: -1 };
      break;

    case "oldest":
      sortQuery = { createdAt: 1 };
      break;

    case "popular":
      sortQuery = { sold: -1 };
      break;

    case "relevance":
    default:
      if (keyword?.trim()) {
        sortQuery = { score: { $meta: "textScore" } };
      } else {
        sortQuery = { createdAt: -1 };
      }

      break;
  }

  /* ------------------------------------------------------------------------
     Query
  ------------------------------------------------------------------------ */

  let query = Product.find(filter);

  /* Text score only when keyword exists */

  if (keyword?.trim()) {
    query = query.select({
      score: {
        $meta: "textScore",
      },
    });
  }

  const [products, total] = await Promise.all([
    query
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .populate("vendor", "fullName email")
      .sort(sortQuery)
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

/* ============================================================================
   SEARCH HISTORY
============================================================================ */

const createSearchHistory = async (searchData, session = null) => {
  const [history] = await SearchHistory.create([searchData], {
    session,
  });

  return history;
};

/* ============================================================================
   FIND USER + KEYWORD HISTORY
============================================================================ */

const findByUserAndKeyword = async (userId, keyword) => {
  return SearchHistory.findOne({
    user: userId,
    keyword,
    isDeleted: false,
  });
};

/* ============================================================================
   UPDATE SEARCH COUNT
============================================================================ */

const updateSearchCount = async (historyId, updateData) => {
  return SearchHistory.findByIdAndUpdate(historyId, updateData, {
    new: true,
    runValidators: true,
  });
};

/* ============================================================================
   GET USER SEARCH HISTORY
============================================================================ */

const findUserSearchHistory = async (
  userId,
  { page = 1, limit = 10, keyword, startDate, endDate, sort = "latest" } = {},
) => {
  const filter = {
    user: userId,
    isDeleted: false,
  };

  /* ------------------------------------------------------------------------
     Keyword Filter
  ------------------------------------------------------------------------ */

  if (keyword?.trim()) {
    filter.keyword = {
      $regex: keyword.trim(),
      $options: "i",
    };
  }

  /* ------------------------------------------------------------------------
     Date Filter
  ------------------------------------------------------------------------ */

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }

    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  /* ------------------------------------------------------------------------
     Pagination
  ------------------------------------------------------------------------ */

  const currentPage = Number(page) || 1;
  const currentLimit = Number(limit) || 10;

  const skip = (currentPage - 1) * currentLimit;

  /* ------------------------------------------------------------------------
     Sorting
  ------------------------------------------------------------------------ */

  let sortQuery = {};

  switch (sort) {
    case "oldest":
      sortQuery = { createdAt: 1 };
      break;

    case "popular":
      sortQuery = { searchCount: -1 };
      break;

    case "latest":
    default:
      sortQuery = { createdAt: -1 };
      break;
  }

  const [history, total] = await Promise.all([
    SearchHistory.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(currentLimit)
      .lean(),

    SearchHistory.countDocuments(filter),
  ]);

  return {
    history,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

/* ============================================================================
   POPULAR SEARCHES
============================================================================ */

const findPopularSearches = async (limit = 10) => {
  return SearchHistory.find({
    isDeleted: false,
  })
    .sort({
      searchCount: -1,
      createdAt: -1,
    })
    .limit(Number(limit))
    .lean();
};

/* ============================================================================
   DELETE SINGLE SEARCH HISTORY
============================================================================ */

const softDeleteHistory = async (historyId, userId = null) => {
  const filter = {
    _id: historyId,
    isDeleted: false,
  };

  /* User ownership check */

  if (userId) {
    filter.user = userId;
  }

  return SearchHistory.findOneAndUpdate(
    filter,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/* ============================================================================
   CLEAR USER SEARCH HISTORY
============================================================================ */

const clearUserHistory = async (userId) => {
  return SearchHistory.updateMany(
    {
      user: userId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
  );
};

/* ============================================================================
   EXPORT
============================================================================ */

export default {
  searchProducts,

  createSearchHistory,
  findByUserAndKeyword,
  updateSearchCount,

  findUserSearchHistory,
  findPopularSearches,

  softDeleteHistory,
  clearUserHistory,
};
