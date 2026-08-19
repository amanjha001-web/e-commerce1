import mongoose from "mongoose";

import searchRepository from "../repositories/search.repository.js";

import ApiError from "../utils/ApiError.js";

/* ============================================================================
   Product Search
============================================================================ */

const searchProducts = async (query = {}) => {
  let {
    keyword = "",
    category,
    brand,
    page = 1,
    limit = 10,
    sort = "relevance",
  } = query;

  /* Normalize */

  keyword = keyword.trim();

  page = Number(page);
  limit = Number(limit);

  /* ============================ Validation ============================ */

  if (!keyword) {
    throw new ApiError(400, "Search keyword is required.");
  }

  if (page < 1) {
    throw new ApiError(400, "Page must be at least 1.");
  }

  if (limit < 1 || limit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100.");
  }

  /* ========================= Category Validation ===================== */

  if (category && !mongoose.Types.ObjectId.isValid(category)) {
    throw new ApiError(400, "Invalid category id.");
  }

  /* =========================== Brand Validation ====================== */

  if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
    throw new ApiError(400, "Invalid brand id.");
  }

  /* =========================== Sorting Validation ==================== */

  const allowedSorts = [
    "relevance",
    "price_asc",
    "price_desc",
    "rating",
    "newest",
    "oldest",
    "popular",
  ];

  if (!allowedSorts.includes(sort)) {
    throw new ApiError(
      400,
      `Invalid sort option. Allowed values: ${allowedSorts.join(", ")}`,
    );
  }

  /* =========================== Repository ============================= */

  return searchRepository.searchProducts({
    keyword,
    category,
    brand,
    page,
    limit,
    sort,
  });
};

/* ============================================================================
   Save Search History
============================================================================ */

const saveSearchHistory = async (searchData) => {
  const { user, keyword, resultCount = 0 } = searchData;

  /* =========================== User Validation ======================= */

  if (!mongoose.Types.ObjectId.isValid(user)) {
    throw new ApiError(400, "Invalid user id.");
  }

  /* =========================== Keyword =============================== */

  const normalizedKeyword = keyword?.trim().toLowerCase();

  if (!normalizedKeyword) {
    throw new ApiError(400, "Search keyword is required.");
  }

  /* =========================== Result Count ========================== */

  const normalizedResultCount = Number(resultCount);

  if (Number.isNaN(normalizedResultCount) || normalizedResultCount < 0) {
    throw new ApiError(400, "Result count must be a non-negative number.");
  }

  /* ====================== Existing History =========================== */

  const existingHistory = await searchRepository.findByUserAndKeyword(
    user,
    normalizedKeyword,
  );

  /* ====================== Update Existing ============================ */

  if (existingHistory) {
    return searchRepository.updateSearchCount(existingHistory._id, {
      searchCount: existingHistory.searchCount + 1,

      resultCount: normalizedResultCount,

      createdAt: new Date(),
    });
  }

  /* ====================== Create New ================================ */

  return searchRepository.createSearchHistory({
    ...searchData,
    keyword: normalizedKeyword,
    resultCount: normalizedResultCount,
    searchCount: 1,
  });
};

/* ============================================================================
   Get User Search History
============================================================================ */

const getUserSearchHistory = async (userId, query = {}) => {
  /* =========================== User Validation ======================= */

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  /* =========================== Pagination ============================= */

  let {
    page = 1,
    limit = 10,
    keyword,
    startDate,
    endDate,
    sort = "createdAt_desc",
  } = query;

  page = Number(page);
  limit = Number(limit);

  if (page < 1) {
    throw new ApiError(400, "Page must be at least 1.");
  }

  if (limit < 1 || limit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100.");
  }

  /* =========================== Date Validation ======================= */

  let normalizedStartDate;
  let normalizedEndDate;

  if (startDate) {
    normalizedStartDate = new Date(startDate);

    if (Number.isNaN(normalizedStartDate.getTime())) {
      throw new ApiError(400, "Invalid start date.");
    }
  }

  if (endDate) {
    normalizedEndDate = new Date(endDate);

    if (Number.isNaN(normalizedEndDate.getTime())) {
      throw new ApiError(400, "Invalid end date.");
    }
  }

  if (
    normalizedStartDate &&
    normalizedEndDate &&
    normalizedStartDate > normalizedEndDate
  ) {
    throw new ApiError(400, "Start date cannot be greater than end date.");
  }

  /* =========================== Sort Validation ======================= */

  const allowedSorts = [
    "createdAt_desc",
    "createdAt_asc",
    "searchCount_desc",
    "searchCount_asc",
    "keyword_asc",
    "keyword_desc",
  ];

  if (!allowedSorts.includes(sort)) {
    throw new ApiError(
      400,
      `Invalid history sort option. Allowed values: ${allowedSorts.join(", ")}`,
    );
  }

  /* =========================== Repository ============================= */

  return searchRepository.findUserSearchHistory(userId, {
    page,
    limit,
    keyword,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    sort,
  });
};

/* ============================================================================
   Popular Searches
============================================================================ */

const getPopularSearches = async (limit = 10) => {
  limit = Number(limit);

  if (Number.isNaN(limit)) {
    throw new ApiError(400, "Limit must be a valid number.");
  }

  if (limit < 1 || limit > 100) {
    throw new ApiError(400, "Limit must be between 1 and 100.");
  }

  return searchRepository.findPopularSearches(limit);
};

/* ============================================================================
   Delete Single Search History
============================================================================ */

const deleteSearchHistory = async (historyId) => {
  /* =========================== ID Validation ========================= */

  if (!mongoose.Types.ObjectId.isValid(historyId)) {
    throw new ApiError(400, "Invalid history id.");
  }

  /* =========================== Delete ================================ */

  const history = await searchRepository.softDeleteHistory(historyId);

  if (!history) {
    throw new ApiError(404, "Search history not found.");
  }

  return history;
};

/* ============================================================================
   Clear User Search History
============================================================================ */

const clearHistory = async (userId) => {
  /* =========================== User Validation ======================= */

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  /* =========================== Clear ================================ */

  return searchRepository.clearUserHistory(userId);
};

/* ============================================================================
   Export
============================================================================ */

export default {
  searchProducts,
  saveSearchHistory,
  getUserSearchHistory,
  getPopularSearches,
  deleteSearchHistory,
  clearHistory,
};
