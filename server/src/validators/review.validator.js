import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(5, 'Review must be at least 5 characters'),
});

export const updateReviewSchema = createReviewSchema.partial();
