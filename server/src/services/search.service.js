import mongoose from "mongoose";

import searchRepository from "../repositories/search.repository.js";

import ApiError from "../utils/ApiError.js";

/*                         Save Search History                                */

const saveSearchHistory = async (searchData) => {
  const { user, keyword, resultCount = 0 } = searchData;

  if (!mongoose.Types.ObjectId.isValid(user)) {
    throw new ApiError(400, "Invalid user id.");
  }

  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    throw new ApiError(400, "Search keyword is required.");
  }

  const existingHistory = await searchRepository.findByUserAndKeyword(
    user,
    normalizedKeyword,
  );

  if (existingHistory) {
    return searchRepository.updateSearchCount(existingHistory._id, {
      searchCount: existingHistory.searchCount + 1,

      resultCount,

      createdAt: new Date(),
    });
  }

  return searchRepository.createSearchHistory({
    ...searchData,
    keyword: normalizedKeyword,
    searchCount: 1,
  });
};

/*                       Get User Search History                              */

const getUserSearchHistory = async (userId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return searchRepository.findUserSearchHistory(userId, query);
};

/*                          Get Popular Searches                              */

const getPopularSearches = async (limit = 10) => {
  return searchRepository.findPopularSearches(Number(limit));
};

/*                         Delete Search History                              */

const deleteSearchHistory = async (historyId) => {
  if (!mongoose.Types.ObjectId.isValid(historyId)) {
    throw new ApiError(400, "Invalid history id.");
  }

  const history = await searchRepository.softDeleteHistory(historyId);

  if (!history) {
    throw new ApiError(404, "Search history not found.");
  }

  return history;
};

/*                        Clear User History                                  */

const clearHistory = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return searchRepository.clearUserHistory(userId);
};

export default {
  saveSearchHistory,
  getUserSearchHistory,
  getPopularSearches,
  deleteSearchHistory,
  clearHistory,
};
