import { z } from "zod";

/*                                  Common                                    */

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const settingType = z.enum(["STRING", "NUMBER", "BOOLEAN", "OBJECT"]);

/*                              Create Setting                                */

const createSetting = z.object({
  body: z.object({
    key: z
      .string()
      .trim()
      .min(2, "Key must be at least 2 characters.")
      .max(100, "Key cannot exceed 100 characters.")
      .regex(/^[A-Z0-9_.-]+$/i, "Invalid setting key format."),

    value: z.any(),

    type: settingType.optional(),

    description: z.string().trim().max(500).optional(),

    isPublic: z.boolean().optional(),
  }),
});

/*                              Update Setting                                */

const updateSetting = z.object({
  params: z.object({
    settingId: objectId,
  }),

  body: z.object({
    key: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[A-Z0-9_.-]+$/i, "Invalid setting key format.")
      .optional(),

    value: z.any().optional(),

    type: settingType.optional(),

    description: z.string().trim().max(500).optional(),

    isPublic: z.boolean().optional(),
  }),
});

/*                              Update Value                                  */

const updateSettingValue = z.object({
  params: z.object({
    settingId: objectId,
  }),

  body: z.object({
    value: z.any(),
  }),
});

/*                                   Params                                   */

const settingIdParam = z.object({
  params: z.object({
    settingId: objectId,
  }),
});

const settingKeyParam = z.object({
  params: z.object({
    key: z.string().trim().min(2).max(100),
  }),
});

/*                                   Query                                    */

const getSettings = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    search: z.string().trim().optional(),

    type: settingType.optional(),

    isPublic: z.enum(["true", "false"]).optional(),

    sort: z.string().optional(),
  }),
});

export default {
  createSetting,
  updateSetting,
  updateSettingValue,
  settingIdParam,
  settingKeyParam,
  getSettings,
};
