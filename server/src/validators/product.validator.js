import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  category: z.string().min(1, 'Category ID is required'),
  brand: z.string().optional(),
  price: z.coerce.number().positive('Price must be greater than zero'),
  compareAtPrice: z.coerce.number().nonnegative().optional(),
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.coerce.number().int().nonnegative('Stock cannot be negative'),
});
