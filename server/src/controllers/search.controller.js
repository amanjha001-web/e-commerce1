import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import searchService from "../services/search.service.js";

/*                        Save Search History                                 */

const saveSearchHistory = asyncHandler(async (req, res) => {
  const history = await searchService.saveSearchHistory({
    ...req.body,
    user: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, history, "Search history saved successfully."));
});

/*                     Get My Search History                                 */

const getMySearchHistory = asyncHandler(async (req, res) => {
  const history = await searchService.getUserSearchHistory(
    req.user._id,
    req.query,
  );

  return res.json(
    new ApiResponse(200, history, "Search history fetched successfully."),
  );
});

/*                         Popular Searches                                  */

const getPopularSearches = asyncHandler(async (req, res) => {
  const searches = await searchService.getPopularSearches(req.query.limit);

  return res.json(
    new ApiResponse(200, searches, "Popular searches fetched successfully."),
  );
});

/*                        Delete Search History                              */

const deleteSearchHistory = asyncHandler(async (req, res) => {
  const { historyId } = req.params;

  const history = await searchService.deleteSearchHistory(historyId);

  return res.json(
    new ApiResponse(200, history, "Search history deleted successfully."),
  );
});

/*                       Clear All History                                   */

const clearSearchHistory = asyncHandler(async (req, res) => {
  await searchService.clearHistory(req.user._id);

  return res.json(
    new ApiResponse(200, null, "Search history cleared successfully."),
  );
});

export default{
  saveSearchHistory,
  getMySearchHistory,
  getPopularSearches,
  deleteSearchHistory,
  clearSearchHistory,
};
