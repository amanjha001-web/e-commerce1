import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(6, 'Phone number must be at least 6 digits'),
  street: z.string().min(2, 'Street / Address is required').optional(),
  addressLine1: z.string().min(2, 'Street / Address is required').optional(),
  apartment: z.string().optional(),
  addressLine2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(4, 'Postal code is required').optional(),
  pincode: z.string().min(4, 'Postal code is required').optional(),
  country: z.string().default('India'),
  addressType: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().optional(),
});
