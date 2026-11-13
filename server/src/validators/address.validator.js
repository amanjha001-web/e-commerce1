import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  street: z.string().min(3),
  apartment: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().default('India'),
  addressType: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().optional(),
});
