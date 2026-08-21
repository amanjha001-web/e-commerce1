import { z } from "zod";

import { objectId } from "./common.validator.js";

/*                         Upload File                         */

export const uploadFileSchema = z.object({
  body: z.object({
    category: z
      .enum([
        "PROFILE",
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "CHAT",
        "DOCUMENT",
        "OTHER",
      ])
      .optional()
      .default("OTHER"),
  }),
});

/*                         Get Files                          */

export const getFilesSchema = z.object({
  query: z.object({
    category: z
      .enum([
        "PROFILE",
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "CHAT",
        "DOCUMENT",
        "OTHER",
      ])
      .optional(),

    type: z.enum(["IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "OTHER"]).optional(),
  }),
});

/*                         Update File                        */

export const updateFileSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "File name cannot be empty")
      .max(255, "File name cannot exceed 255 characters")
      .optional(),

    category: z
      .enum([
        "PROFILE",
        "PRODUCT",
        "CATEGORY",
        "BRAND",
        "CHAT",
        "DOCUMENT",
        "OTHER",
      ])
      .optional(),
  }),
});

/*                         Delete File                        */

export const deleteFileSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                        Restore File                        */

export const restoreFileSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                           Export                            */

export default {
  uploadFileSchema,
  getFilesSchema,
  updateFileSchema,
  deleteFileSchema,
  restoreFileSchema,
};
