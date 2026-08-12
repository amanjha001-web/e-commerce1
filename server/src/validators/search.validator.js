import { z } from "zod";

/*                                  Common                                    */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

/*                              Create Search                                 */

const createSearchHistory = z.object({
  body: z.object({
    keyword: z
      .string()
      .trim()
      .min(1, "Keyword is required.")
      .max(100, "Keyword cannot exceed 100 characters."),

    resultCount: z.coerce.number().min(0).optional(),
  }),
});

/*                              Update Search                                 */

const updateSearchHistory = z.object({
  params: z.object({
    searchId: objectId,
  }),

  body: z.object({
    keyword: z.string().trim().min(1).max(100).optional(),

    resultCount: z.coerce.number().min(0).optional(),
  }),
});

/*                                 Params                                     */

const searchIdParam = z.object({
  params: z.object({
    searchId: objectId,
  }),
});

/*                                  Query                                     */

const getSearchHistory = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    keyword: z.string().trim().optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),

    sort: z.string().optional(),
  }),
});

/*                              Delete History                                */

const deleteSearchHistory = z.object({
  params: z.object({
    searchId: objectId,
  }),
});

export default {
  createSearchHistory,
  updateSearchHistory,
  searchIdParam,
  getSearchHistory,
  deleteSearchHistory,
};
