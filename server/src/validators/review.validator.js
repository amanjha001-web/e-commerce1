import { z } from "zod";

import { objectId, positiveInteger } from "./common.validator.js";

/*                               Base Schema                                  */

const reviewBody = {
  product: objectId,

  rating: positiveInteger.min(1).max(5, "Rating must be between 1 and 5"),

  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),

  comment: z
    .string()
    .trim()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment cannot exceed 1000 characters"),

  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 review images allowed")
    .optional(),

  recommend: z.coerce.boolean().optional(),
};

/*                             Create Review                                  */

export const createReviewSchema = z.object({
  body: z.object(reviewBody),
});

/*                             Update Review                                  */

export const updateReviewSchema = z.object({
  params: z.object({
    id: objectId,
  }),

  body: z.object({
    rating: reviewBody.rating.optional(),

    title: reviewBody.title.optional(),

    comment: reviewBody.comment.optional(),

    images: reviewBody.images,

    recommend: reviewBody.recommend,
  }),
});

/*                             Review Id                                      */

export const reviewIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                            Product Reviews                                 */

export const productReviewSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                           Delete Review                                    */

export const deleteReviewSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
