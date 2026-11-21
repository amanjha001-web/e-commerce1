import { z } from 'zod';

const emptyToUndefined = (val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return val;
};

export const createProductSchema = z.object({
  name: z.string().trim().min(3, 'Product name must be at least 3 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().trim().optional(),
  category: z.string().trim().min(1, 'Category ID is required'),
  brand: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  price: z.coerce.number().positive('Price must be greater than zero'),
  compareAtPrice: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative('Compare at price cannot be negative').optional()
  ),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
  sku: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  status: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  isActive: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
});
