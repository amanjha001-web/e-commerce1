import SearchHistory from "../models/SearchHistory.model.js";

/*                           Create Search History                            */

const createSearchHistory = async (searchData, session = null) => {
  const [history] = await SearchHistory.create([searchData], {
    session,
  });

  return history;
};

/*                     Find User Keyword History                              */

const findByUserAndKeyword = async (userId, keyword) => {
  return SearchHistory.findOne({
    user: userId,
    keyword,
  });
};

/*                         Update Search Count                                */

const updateSearchCount = async (historyId, updateData) => {
  return SearchHistory.findByIdAndUpdate(historyId, updateData, {
    new: true,
    runValidators: true,
  });
};

/*                         Get User Searches                                  */

const findUserSearchHistory = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const history = await SearchHistory.find({
    user: userId,
    isDeleted: false,
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await SearchHistory.countDocuments({
    user: userId,
    isDeleted: false,
  });

  return {
    history,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                           Popular Searches                                 */

const findPopularSearches = async (limit = 10) => {
  return SearchHistory.find({
    isDeleted: false,
  })
    .sort({
      searchCount: -1,
    })
    .limit(limit);
};

/*                            Delete History                                  */

const softDeleteHistory = async (historyId) => {
  return SearchHistory.findByIdAndUpdate(
    historyId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                         Clear User History                                 */

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

export default {
  createSearchHistory,
  findByUserAndKeyword,
  updateSearchCount,
  findUserSearchHistory,
  findPopularSearches,
  softDeleteHistory,
  clearUserHistory,
};
