import { z } from "zod";

/*                              Enums                                         */

const categoryEnum = z.enum([
  "ORDER",
  "PAYMENT",
  "DELIVERY",
  "RETURN",
  "ACCOUNT",
  "PRODUCT",
  "TECHNICAL",
  "OTHER",
]);

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const statusEnum = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
]);

/*                         Mongo ObjectId                                     */

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId.");

/*                      Create Support Ticket                                 */

export const createSupportTicketSchema = z.object({
  body: z.object({
    order: objectId.optional(),

    subject: z.string().trim().min(5).max(150),

    description: z.string().trim().min(10).max(5000),

    category: categoryEnum.optional(),

    priority: priorityEnum.optional(),

    attachments: z.array(objectId).optional(),
  }),
});

/*                         Update Ticket                                      */

export const updateSupportTicketSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(5).max(150).optional(),

    description: z.string().trim().min(10).max(5000).optional(),

    category: categoryEnum.optional(),

    priority: priorityEnum.optional(),

    attachments: z.array(objectId).optional(),
  }),

  params: z.object({
    ticketId: objectId,
  }),
});

/*                           Assign Ticket                                    */

export const assignTicketSchema = z.object({
  body: z.object({
    assignedTo: objectId,
  }),

  params: z.object({
    ticketId: objectId,
  }),
});

/*                          Resolve Ticket                                    */

export const resolveTicketSchema = z.object({
  body: z.object({
    resolution: z.string().trim().min(5).max(3000),

    adminNote: z.string().trim().max(3000).optional(),
  }),

  params: z.object({
    ticketId: objectId,
  }),
});

/*                           Close Ticket                                     */

export const closeTicketSchema = z.object({
  params: z.object({
    ticketId: objectId,
  }),
});

/*                       Get/Delete Ticket                                    */

export const ticketIdSchema = z.object({
  params: z.object({
    ticketId: objectId,
  }),
});

/*                           Query Validation                                 */

export const supportQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional(),

    limit: z.coerce.number().min(1).max(100).optional(),

    status: statusEnum.optional(),

    priority: priorityEnum.optional(),

    category: categoryEnum.optional(),
  }),
});

/*                         Reply Ticket                                    */

export const replySupportTicketSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(5000),
  }),

  params: z.object({
    ticketId: objectId,
  }),
});
