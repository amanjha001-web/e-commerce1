import { z } from 'zod';

const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const BANNER_POSITIONS = [
  'home_hero',
  'home_middle',
  'home_bottom',
  'category_top',
  'sidebar',
  'product_page',
];

const POSITION_ALIASES = {
  home_hero: 'home_hero',
  homepage_hero: 'home_hero',
  hero: 'home_hero',
  home_middle: 'home_middle',
  homepage_middle: 'home_middle',
  home_bottom: 'home_bottom',
  homepage_bottom: 'home_bottom',
  category_top: 'category_top',
  category: 'category_top',
  shop: 'category_top',
  sidebar: 'sidebar',
  product_page: 'product_page',
  product: 'product_page',
};

export const normalizeBannerPosition = (raw) => {
  if (!raw) return undefined;
  const key = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return POSITION_ALIASES[key] || (BANNER_POSITIONS.includes(key) ? key : raw);
};

const parseDateInput = (value, { endOfDay = false } = {}) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'INVALID_DATE' : value;
  }
  const str = String(value).trim();
  if (!str || str.toLowerCase() === 'null') return null;
  if (ISO_DATE_ONLY_REGEX.test(str)) {
    return new Date(endOfDay ? `${str}T23:59:59.999Z` : `${str}T00:00:00.000Z`);
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? 'INVALID_DATE' : parsed;
};

const normalizeRawBannerBody = (raw = {}, isUpdate = false) => {
  if (!raw || typeof raw !== 'object') return {};

  const normalized = { ...raw };

  if (normalized.title === undefined && normalized.name !== undefined) {
    normalized.title = normalized.name;
  }

  if (normalized.position === undefined && normalized.section !== undefined) {
    normalized.position = normalized.section;
  }
  if (normalized.position !== undefined) {
    normalized.position = normalizeBannerPosition(normalized.position);
  }

  if (normalized.isActive === undefined && normalized.status !== undefined) {
    const st = String(normalized.status).trim().toUpperCase();
    if (st === 'ACTIVE') normalized.isActive = true;
    else if (st === 'INACTIVE' || st === 'PAUSED') normalized.isActive = false;
  }
  if (typeof normalized.isActive === 'string') {
    normalized.isActive = normalized.isActive.toLowerCase() === 'true';
  }

  if (typeof normalized.image === 'string') {
    const trimmed = normalized.image.trim();
    if (trimmed.startsWith('{')) {
      try {
        normalized.image = JSON.parse(trimmed);
      } catch {
        delete normalized.image;
      }
    } else if (trimmed) {
      normalized.image = { url: trimmed, publicId: '' };
    } else {
      delete normalized.image;
    }
  }

  if (typeof normalized.imageUrl === 'string' && !normalized.imageUrl.trim()) {
    delete normalized.imageUrl;
  }

  if (normalized.startDate !== undefined) {
    const parsedStart = parseDateInput(normalized.startDate, { endOfDay: false });
    if (parsedStart === null && !isUpdate) {
      delete normalized.startDate;
    } else {
      normalized.startDate = parsedStart;
    }
  }

  if (normalized.endDate !== undefined) {
    normalized.endDate = parseDateInput(normalized.endDate, { endOfDay: true });
  }

  if (normalized.sortOrder === '') {
    normalized.sortOrder = isUpdate ? undefined : 0;
  }

  return normalized;
};

const nullableDateSchema = z
  .union([z.date(), z.null()])
  .optional();

const baseBannerShape = {
  title: z.string().trim().min(2, 'Banner title must be at least 2 characters').max(140, 'Banner title is too long'),
  subtitle: z.string().trim().max(200).optional(),
  description: z.string().trim().max(500).optional(),
  buttonText: z.string().trim().max(60).optional(),
  link: z.string().trim().max(500).optional(),
  position: z.enum(['home_hero', 'home_middle', 'home_bottom', 'category_top', 'sidebar', 'product_page']).default('home_hero'),
  sortOrder: z.coerce.number().int().min(0, 'Sort order cannot be negative').default(0),
  isActive: z.boolean().default(true),
  startDate: nullableDateSchema,
  endDate: nullableDateSchema,
  imageUrl: z.string().trim().max(1000).optional(),
  image: z
    .object({
      url: z.string().trim().min(1),
      publicId: z.string().optional(),
    })
    .optional(),
};

const addBannerDateRefinement = (schema) =>
  schema.superRefine((data, ctx) => {
    if (
      data.startDate instanceof Date &&
      data.endDate instanceof Date &&
      data.endDate.getTime() < data.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date',
      });
    }
  });

export const createBannerSchema = z.preprocess(
  (raw) => normalizeRawBannerBody(raw, false),
  addBannerDateRefinement(z.object(baseBannerShape))
);

export const updateBannerSchema = z.preprocess(
  (raw) => normalizeRawBannerBody(raw, true),
  addBannerDateRefinement(
    z.object({
      title: baseBannerShape.title.optional(),
      subtitle: baseBannerShape.subtitle,
      description: baseBannerShape.description,
      buttonText: baseBannerShape.buttonText,
      link: baseBannerShape.link,
      position: z.enum(['home_hero', 'home_middle', 'home_bottom', 'category_top', 'sidebar', 'product_page']).optional(),
      sortOrder: z.coerce.number().int().min(0, 'Sort order cannot be negative').optional(),
      isActive: z.boolean().optional(),
      startDate: nullableDateSchema,
      endDate: nullableDateSchema,
      imageUrl: baseBannerShape.imageUrl,
      image: baseBannerShape.image,
    })
  )
);

export const bannerSchema = createBannerSchema;
