import { z } from "zod";
import mongoose from "mongoose";

/*                              Helpers                                    */

const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId.",
  });

/*                       Create Conversation                              */

const createConversationSchema = z.object({
  body: z.object({
    participants: z
      .array(objectId)
      .min(2, "Conversation must have at least 2 participants.")
      .max(10, "Conversation cannot have more than 10 participants."),

    type: z
      .enum(["CUSTOMER_VENDOR", "CUSTOMER_SUPPORT", "VENDOR_ADMIN"])
      .default("CUSTOMER_SUPPORT"),
  }),
});

/*                    Conversation ID                                    */

const conversationIdSchema = z.object({
  params: z.object({
    conversationId: objectId,
  }),
});

/*                    Update Conversation                                 */

const updateConversationSchema = z.object({
  body: z.object({
    isClosed: z.boolean().optional(),
  }),
});

/*                         Pagination                                      */

const conversationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),

    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

/*                              Export                                      */

export default {
  createConversationSchema,
  conversationIdSchema,
  updateConversationSchema,
  conversationQuerySchema,
};
