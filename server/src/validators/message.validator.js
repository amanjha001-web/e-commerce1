import { z } from "zod";
import mongoose from "mongoose";

/*                              Helpers                              */

const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId.",
  });

/*                         Create Message                            */

const createMessageSchema = z.object({
  body: z.object({
    conversation: objectId,

    message: z
      .string()
      .trim()
      .min(1, "Message cannot be empty")
      .max(5000, "Message cannot exceed 5000 characters")
      .optional(),

    attachments: z
      .array(
        z.object({
          url: z.string().url("Invalid attachment URL."),
          type: z.string().trim().min(1),
        }),
      )
      .max(10, "Maximum 10 attachments allowed")
      .optional(),

    messageType: z.enum(["TEXT", "IMAGE", "FILE"]).default("TEXT"),
  }),
});

/*                         Message Id                               */

const messageIdSchema = z.object({
  params: z.object({
    messageId: objectId,
  }),
});

/*                    Conversation Id                              */

const conversationIdSchema = z.object({
  params: z.object({
    conversationId: objectId,
  }),
});

/*                         Update Message                            */

const updateMessageSchema = z.object({
  body: z.object({
    message: z
      .string()
      .trim()
      .min(1, "Message cannot be empty")
      .max(5000, "Message cannot exceed 5000 characters"),
  }),
});

/*                         Pagination                                */

const messageQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export default {
  createMessageSchema,
  messageIdSchema,
  conversationIdSchema,
  updateMessageSchema,
  messageQuerySchema,
};
