import { z } from "zod";

/*                                 Common                                     */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const imageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().trim().optional(),
});

const statusEnum = z.enum(["ACTIVE", "INACTIVE", "SCHEDULED"]);

const redirectTypeEnum = z.enum([
  "PRODUCT",
  "CATEGORY",
  "COLLECTION",
  "EXTERNAL",
  "NONE",
]);

/*                              Create Banner                                 */

const createBanner = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(150),

    description: z.string().trim().max(1000).optional(),

    image: imageSchema,

    mobileImage: imageSchema.partial().optional(),

    redirectType: redirectTypeEnum.optional(),

    redirectId: objectId.optional(),

    redirectUrl: z.string().url().optional(),

    position: z.coerce.number().min(0).optional(),

    status: statusEnum.optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
  }),
});

/*                              Update Banner                                 */

const updateBanner = z.object({
  params: z.object({
    bannerId: objectId,
  }),

  body: z.object({
    title: z.string().trim().min(2).max(150).optional(),

    description: z.string().trim().max(1000).optional(),

    image: imageSchema.partial().optional(),

    mobileImage: imageSchema.partial().optional(),

    redirectType: redirectTypeEnum.optional(),

    redirectId: objectId.optional(),

    redirectUrl: z.string().url().optional(),

    position: z.coerce.number().min(0).optional(),

    status: statusEnum.optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
  }),
});

/*                                Params                                      */

const bannerIdParam = z.object({
  params: z.object({
    bannerId: objectId,
  }),
});

/*                                 Query                                      */

const getBanners = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    status: statusEnum.optional(),

    redirectType: redirectTypeEnum.optional(),

    search: z.string().trim().optional(),

    sort: z.string().optional(),
  }),
});

export default {
  createBanner,
  updateBanner,
  bannerIdParam,
  getBanners,
};
