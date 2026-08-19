import { z } from "zod";

/* ============================================================================
   COMMON
============================================================================ */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

/* ============================================================================
   PRODUCT SEARCH
============================================================================ */

const searchProducts = z.object({
  query: z.object({
    /* ------------------------------------------------------------------------
       Basic / Product Search
    ------------------------------------------------------------------------ */

    keyword: z
      .string()
      .trim()
      .max(100, "Keyword cannot exceed 100 characters.")
      .optional(),

    /* ------------------------------------------------------------------------
       Category Filter
    ------------------------------------------------------------------------ */

    category: objectId.optional(),

    /* ------------------------------------------------------------------------
       Brand Filter
    ------------------------------------------------------------------------ */

    brand: objectId.optional(),

    /* ------------------------------------------------------------------------
       Price Filter
    ------------------------------------------------------------------------ */

    minPrice: z.coerce
      .number()
      .min(0, "Minimum price cannot be negative.")
      .optional(),

    maxPrice: z.coerce
      .number()
      .min(0, "Maximum price cannot be negative.")
      .optional(),

    /* ------------------------------------------------------------------------
       Pagination
    ------------------------------------------------------------------------ */

    page: z.coerce.number().int().min(1, "Page must be at least 1.").optional(),

    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1.")
      .max(100, "Limit cannot exceed 100.")
      .optional(),

    /* ------------------------------------------------------------------------
       Sorting
    ------------------------------------------------------------------------ */

    sort: z
      .enum([
        "relevance",
        "price_asc",
        "price_desc",
        "rating",
        "newest",
        "oldest",
        "popular",
      ])
      .optional(),
  }),
});

/* ============================================================================
   CREATE SEARCH HISTORY
============================================================================ */

const createSearchHistory = z.object({
  body: z.object({
    keyword: z
      .string()
      .trim()
      .min(1, "Keyword is required.")
      .max(100, "Keyword cannot exceed 100 characters."),

    resultCount: z.coerce
      .number()
      .int()
      .min(0, "Result count cannot be negative.")
      .optional(),
  }),
});

/* ============================================================================
   GET MY SEARCH HISTORY
============================================================================ */

const getSearchHistory = z.object({
  query: z.object({
    /* ------------------------------------------------------------------------
       Pagination
    ------------------------------------------------------------------------ */

    page: z.coerce.number().int().min(1, "Page must be at least 1.").optional(),

    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1.")
      .max(100, "Limit cannot exceed 100.")
      .optional(),

    /* ------------------------------------------------------------------------
       Keyword Filter
    ------------------------------------------------------------------------ */

    keyword: z
      .string()
      .trim()
      .max(100, "Keyword cannot exceed 100 characters.")
      .optional(),

    /* ------------------------------------------------------------------------
       Date Filters
    ------------------------------------------------------------------------ */

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),

    /* ------------------------------------------------------------------------
       History Sorting
    ------------------------------------------------------------------------ */

    sort: z.enum(["latest", "oldest", "popular"]).optional(),
  }),
});

/* ============================================================================
   DELETE SEARCH HISTORY
============================================================================ */

const deleteSearchHistory = z.object({
  params: z.object({
    historyId: objectId,
  }),
});

/* ============================================================================
   SEARCH HISTORY ID
============================================================================ */

const searchIdParam = z.object({
  params: z.object({
    historyId: objectId,
  }),
});

/* ============================================================================
   POPULAR SEARCHES
============================================================================ */

const popularSearches = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1.")
      .max(100, "Limit cannot exceed 100.")
      .optional(),
  }),
});

/* ============================================================================
   EXPORT
============================================================================ */

export default {
  searchProducts,
  createSearchHistory,
  getSearchHistory,
  deleteSearchHistory,
  searchIdParam,
  popularSearches,
};
