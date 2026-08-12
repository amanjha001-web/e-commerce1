import { z } from "zod";
import mongoose from "mongoose";

/*                               Helpers                                      */

const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId.",
  });

/*                             Create Chat                                    */

const createChatSchema = z.object({
  body: z.object({
    conversation: objectId,

    user: objectId,

    socketId: z.string().trim().min(1).max(255).optional(),

    online: z.boolean().optional(),

    lastSeen: z.coerce.date().optional(),

    deviceInfo: z
      .object({
        browser: z.string().trim().optional(),

        os: z.string().trim().optional(),

        platform: z.string().trim().optional(),

        device: z.string().trim().optional(),

        ip: z.string().trim().optional(),
      })
      .optional(),
  }),
});

/*                              Update Chat                                   */

const updateChatSchema = z.object({
  body: z.object({
    socketId: z.string().trim().optional(),

    online: z.boolean().optional(),

    lastSeen: z.coerce.date().optional(),

    deviceInfo: z
      .object({
        browser: z.string().trim().optional(),

        os: z.string().trim().optional(),

        platform: z.string().trim().optional(),

        device: z.string().trim().optional(),

        ip: z.string().trim().optional(),
      })
      .partial()
      .optional(),
  }),
});

/*                          Update Presence                                   */

const updatePresenceSchema = z.object({
  body: z.object({
    online: z.boolean(),

    socketId: z.string().trim().optional(),

    lastSeen: z.coerce.date().optional(),
  }),
});

/*                             Params                                         */

const chatIdSchema = z.object({
  params: z.object({
    chatId: objectId,
  }),
});

const conversationIdSchema = z.object({
  params: z.object({
    conversationId: objectId,
  }),
});

const userIdSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
});

const conversationUserSchema = z.object({
  params: z.object({
    conversationId: objectId,
    userId: objectId,
  }),
});


export default {
  createChatSchema,
  updateChatSchema,
  updatePresenceSchema,
  chatIdSchema,
  conversationIdSchema,
  userIdSchema,
  conversationUserSchema,
};
