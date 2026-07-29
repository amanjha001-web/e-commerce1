import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Create Product Schema
|--------------------------------------------------------------------------
*/

export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Product name must be at least 3 characters"),

    shortDescription: z
      .string()
      .trim()
      .min(10, "Short description is too short")
      .max(250),

    description: z.string().trim().min(20, "Description is too short"),

    category: z.string().min(1, "Category is required"),

    brand: z.string().min(1, "Brand is required"),

    price: z.coerce
      .number({
        required_error: "Price is required",
      })
      .positive("Price must be greater than 0"),

    discountPrice: z.coerce.number().min(0).optional(),

    stock: z.coerce
      .number({
        required_error: "Stock is required",
      })
      .min(0),

    tags: z.array(z.string()).optional(),

    featured: z.coerce.boolean().optional(),

    flashSale: z.coerce.boolean().optional(),

    bestSeller: z.coerce.boolean().optional(),

    trending: z.coerce.boolean().optional(),

    newArrival: z.coerce.boolean().optional(),
  }),
});

/*
|--------------------------------------------------------------------------
| Update Product Schema
|--------------------------------------------------------------------------
*/

export const updateProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(3, "Product name must be at least 3 characters")
      .optional(),

    shortDescription: z
      .string()
      .trim()
      .min(10, "Short description is too short")
      .max(250)
      .optional(),

    description: z
      .string()
      .trim()
      .min(20, "Description is too short")
      .optional(),

    category: z.string().optional(),

    brand: z.string().optional(),

    price: z.coerce
      .number()
      .positive("Price must be greater than 0")
      .optional(),

    discountPrice: z.coerce.number().min(0).optional(),

    stock: z.coerce.number().min(0).optional(),

    tags: z.array(z.string()).optional(),

    featured: z.coerce.boolean().optional(),

    flashSale: z.coerce.boolean().optional(),

    bestSeller: z.coerce.boolean().optional(),

    trending: z.coerce.boolean().optional(),

    newArrival: z.coerce.boolean().optional(),
  }),
});
