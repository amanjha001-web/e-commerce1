import { Router } from "express";

import {searchController} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";

const router = Router();

/*                        Save Search History                                 */

router.post("/", authMiddleware, searchController.saveSearchHistory);

/*                         My Search History                                 */

router.get("/my-history", authMiddleware, searchController.getMySearchHistory);

/*                          Popular Searches                                 */

router.get("/popular", searchController.getPopularSearches);

/*                       Delete Single History                               */

router.delete(
  "/:historyId",
  authMiddleware,
  searchController.deleteSearchHistory,
);

/*                        Clear User History                                 */

router.delete("/clear", authMiddleware, searchController.clearSearchHistory);

export default router;
