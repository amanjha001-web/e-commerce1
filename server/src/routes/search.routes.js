import { Router } from "express";

import { searchController } from "../controllers/index.js";

import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/index.js";

const router = Router();

/* ============================================================================
   PRODUCT SEARCH
============================================================================ */

/*
  1. Basic Search
  2. Empty Search
  3. Product Search
  4. Category / Brand Filters
  5. Pagination
  6. Sorting

  GET /api/v1/search/products?keyword=motorola

  GET /api/v1/search/products?keyword=phone&category=CATEGORY_ID

  GET /api/v1/search/products?keyword=phone&brand=BRAND_ID

  GET /api/v1/search/products?keyword=phone&category=CATEGORY_ID&brand=BRAND_ID

  GET /api/v1/search/products?keyword=phone&page=1&limit=10

  GET /api/v1/search/products?keyword=phone&sort=price_asc

  GET /api/v1/search/products?keyword=phone&sort=price_desc

  GET /api/v1/search/products?keyword=phone&sort=rating

  GET /api/v1/search/products?keyword=phone&sort=newest
*/

router.get(
  "/products",
  optionalAuthMiddleware,
  searchController.searchProducts,
);

/* ============================================================================
   SEARCH HISTORY
============================================================================ */

/*
  7. Save Search History
*/

router.post("/history", authMiddleware, searchController.saveSearchHistory);

/*
  My Search History
*/

router.get("/my-history", authMiddleware, searchController.getMySearchHistory);

/*
  Popular Searches
*/

router.get("/popular", searchController.getPopularSearches);

/* ============================================================================
   CLEAR SEARCH HISTORY
============================================================================ */

/*
  8. Clear Search History

  IMPORTANT:
  /clear must be before /:historyId
*/

router.delete("/clear", authMiddleware, searchController.clearSearchHistory);

/* ============================================================================
   DELETE SINGLE SEARCH HISTORY
============================================================================ */

router.delete(
  "/:historyId",
  authMiddleware,
  searchController.deleteSearchHistory,
);

export default router;
