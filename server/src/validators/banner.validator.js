import { z } from 'zod';

export const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  link: z.string().optional(),
  position: z.enum(['home_hero', 'home_middle', 'home_bottom', 'category_top', 'sidebar']).default('home_hero'),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
