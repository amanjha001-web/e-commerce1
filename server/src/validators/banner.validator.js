import { z } from "zod";

/*                                Common                                      */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const imageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().trim().optional(),
});

const statusEnum = z.enum(["ACTIVE", "INACTIVE", "SCHEDULED"]);

const redirectTypeEnum = z.enum([
  "PRODUCT",
  "CATEGORY",
  "BRAND",
  "COLLECTION",
  "SHOP",
  "EXTERNAL",
  "NONE",
]);

const sectionEnum = z.enum([
  "HOME_HERO",
  "HOME_MIDDLE",
  "HOME_BOTTOM",
  "CATEGORY",
  "PRODUCT",
  "APP",
]);

const deviceEnum = z.enum(["ALL", "DESKTOP", "MOBILE", "TABLET"]);

/*                              Create Banner                                 */

const createBanner = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(150, "Title cannot exceed 150 characters"),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

   

    redirectType: redirectTypeEnum.optional(),

    redirectId: objectId.optional(),

    redirectUrl: z.string().url("Invalid redirect URL").optional(),

    position: z.coerce
      .number()
      .min(0, "Position cannot be negative")
      .optional(),

    section: sectionEnum.optional(),

    device: deviceEnum.optional(),

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
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(150, "Title cannot exceed 150 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    

    redirectType: redirectTypeEnum.optional(),

    redirectId: objectId.optional(),

    redirectUrl: z.string().url("Invalid redirect URL").optional(),

    position: z.coerce
      .number()
      .min(0, "Position cannot be negative")
      .optional(),

    section: sectionEnum.optional(),

    device: deviceEnum.optional(),

    status: statusEnum.optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
  }),
});

/*                              Banner ID Params                              */

const bannerIdParam = z.object({
  params: z.object({
    bannerId: objectId,
  }),
});

/*                               Get Banners                                  */

const getBanners = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    status: statusEnum.optional(),

    redirectType: redirectTypeEnum.optional(),

    section: sectionEnum.optional(),

    device: deviceEnum.optional(),

    search: z.string().trim().optional(),

    sort: z.string().optional(),
  }),
});

/*                                  Export                                    */

export default {
  createBanner,
  updateBanner,
  bannerIdParam,
  getBanners,
};
