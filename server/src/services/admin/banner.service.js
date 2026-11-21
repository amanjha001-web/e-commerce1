import { Banner } from '../../models/Banner.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, slugify } from '../../utils/helpers.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../integrations/cloudinary/cloudinary.client.js';
import { normalizeBannerPosition } from '../../validators/banner.validator.js';

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const DEFAULT_FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80';

const POSITION_LABELS = {
  home_hero: 'Homepage hero',
  home_middle: 'Homepage middle',
  home_bottom: 'Homepage bottom',
  category_top: 'Shop / Categories top',
  sidebar: 'Sidebar promo',
  product_page: 'Product page',
};

const assertValidObjectId = (id, label = 'Banner ID') => {
  if (!id || !OBJECT_ID_REGEX.test(String(id).trim())) {
    throw ApiError.badRequest(`Invalid ${label} format`);
  }
};

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveDateField = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatScheduleLabel = (startDate, endDate, legacySchedule) => {
  const fmt = (dt) =>
    dt.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (startDate) return `From ${fmt(startDate)}`;
  if (endDate) return `Until ${fmt(endDate)}`;
  if (legacySchedule) return String(legacySchedule);
  return 'Always active';
};

const computeBannerLifecycle = (raw, now = new Date()) => {
  const startDate = resolveDateField(raw.startDate);
  const endDate = resolveDateField(raw.endDate);
  const statusStr = String(raw.status || '').trim().toUpperCase();
  const isActive =
    raw.isActive !== false && statusStr !== 'INACTIVE' && statusStr !== 'PAUSED';

  const nowMs = now.getTime();
  const isExpired = endDate !== null && endDate.getTime() < nowMs;
  const isScheduled =
    !isExpired && isActive && startDate !== null && startDate.getTime() > nowMs;

  let computedStatus = 'active';
  let statusLabel = 'Active';

  if (isExpired) {
    computedStatus = 'expired';
    statusLabel = 'Expired';
  } else if (!isActive) {
    computedStatus = 'inactive';
    statusLabel = 'Inactive';
  } else if (isScheduled) {
    computedStatus = 'scheduled';
    statusLabel = 'Scheduled';
  }

  return {
    startDate,
    endDate,
    isActive,
    isExpired,
    isScheduled,
    computedStatus,
    statusLabel,
  };
};

export const formatAdminBanner = (doc, now = new Date()) => {
  if (!doc) return null;
  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const lifecycle = computeBannerLifecycle(raw, now);

  const normalizedPos = normalizeBannerPosition(raw.position || raw.section) || 'home_hero';
  const placementLabel = POSITION_LABELS[normalizedPos] || 'Homepage hero';

  const imageUrl =
    typeof raw.image === 'string'
      ? raw.image
      : raw.image?.url || raw.imageUrl || '';
  const publicId =
    typeof raw.image === 'object' && raw.image?.publicId ? raw.image.publicId : '';

  const impressions = Math.max(0, Number(raw.impressions) || 0);
  const clicks = Math.max(0, Number(raw.clicks) || 0);
  const ctr =
    impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0;

  return {
    ...raw,
    _id: raw._id,
    id: raw._id,
    title: raw.title || raw.name || 'Promotional Banner',
    subtitle: raw.subtitle || '',
    description: raw.description || '',
    buttonText: raw.buttonText || '',
    link: raw.link || '',
    position: normalizedPos,
    placementLabel,
    sortOrder: Number(raw.sortOrder) || 0,
    image: { url: imageUrl, publicId },
    imageUrl,
    startDate: lifecycle.startDate,
    endDate: lifecycle.endDate,
    scheduleLabel: formatScheduleLabel(
      lifecycle.startDate,
      lifecycle.endDate,
      raw.schedule
    ),
    isActive: lifecycle.isActive,
    isExpired: lifecycle.isExpired,
    isScheduled: lifecycle.isScheduled,
    computedStatus: lifecycle.computedStatus,
    statusLabel: lifecycle.statusLabel,
    impressions,
    clicks,
    ctr,
  };
};

const buildNotExpiredCondition = (now) => ({
  $or: [
    { endDate: { $exists: false } },
    { endDate: null },
    { endDate: { $gte: now } },
  ],
});

const buildStartedCondition = (now) => ({
  $or: [
    { startDate: { $exists: false } },
    { startDate: null },
    { startDate: { $lte: now } },
  ],
});

const buildStatusConditions = (status, now) => {
  const key = String(status || '').trim().toLowerCase();
  if (key === 'expired') {
    return [{ endDate: { $lt: now } }];
  }
  if (key === 'inactive') {
    return [{ isActive: false }, buildNotExpiredCondition(now)];
  }
  if (key === 'scheduled') {
    return [
      { isActive: { $ne: false } },
      { startDate: { $gt: now } },
      buildNotExpiredCondition(now),
    ];
  }
  if (key === 'active') {
    return [
      { isActive: { $ne: false } },
      buildStartedCondition(now),
      buildNotExpiredCondition(now),
    ];
  }
  return [];
};

const runBannerQuery = (filter, { sort, skip, limit }) => {
  let query = Banner.find(filter);
  if (typeof query.sort === 'function') {
    query = query.sort(sort);
  }
  if (typeof query.skip === 'function') {
    query = query.skip(skip);
  }
  if (typeof query.limit === 'function') {
    query = query.limit(limit);
  }
  if (typeof query.lean === 'function') {
    query = query.lean();
  }
  return query;
};

export class AdminBannerService {
  async getAll(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const effectiveSort = params.sort ? sort : { sortOrder: 1, createdAt: -1 };
    const now = new Date();
    const andConditions = [];

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      andConditions.push(...buildStatusConditions(params.status, now));
    } else if (params.isActive !== undefined && params.isActive !== '') {
      const wantActive = String(params.isActive).toLowerCase() === 'true';
      andConditions.push(wantActive ? { isActive: { $ne: false } } : { isActive: false });
    }

    if (params.position && String(params.position).toLowerCase() !== 'all') {
      const normalizedPos = normalizeBannerPosition(params.position);
      andConditions.push({ position: normalizedPos });
    }

    if (params.search && String(params.search).trim()) {
      const rx = { $regex: escapeRegex(String(params.search).trim()), $options: 'i' };
      andConditions.push({
        $or: [
          { title: rx },
          { subtitle: rx },
          { description: rx },
          { slug: rx },
          { link: rx },
        ],
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};

    const safeCount = (cond) =>
      Promise.resolve(Banner.countDocuments(cond))
        .then((n) => Math.max(0, Number(n) || 0))
        .catch(() => 0);

    const [rawBanners, total, allTotal, activeCount, scheduledCount, expiredCount, inactiveCount] =
      await Promise.all([
        runBannerQuery(filter, { sort: effectiveSort, skip, limit }),
        Banner.countDocuments(filter),
        safeCount({}),
        safeCount({ $and: buildStatusConditions('active', now) }),
        safeCount({ $and: buildStatusConditions('scheduled', now) }),
        safeCount({ $and: buildStatusConditions('expired', now) }),
        safeCount({ $and: buildStatusConditions('inactive', now) }),
      ]);

    const banners = Array.isArray(rawBanners)
      ? rawBanners.map((doc) => formatAdminBanner(doc, now))
      : [];

    const totalNum = Math.max(0, Number(total) || 0);

    return {
      banners,
      summary: {
        total: allTotal,
        active: activeCount,
        scheduled: scheduledCount,
        expired: expiredCount,
        inactive: inactiveCount,
      },
      pagination: {
        total: totalNum,
        page,
        limit,
        totalPages: Math.ceil(totalNum / limit) || 1,
      },
    };
  }

  async getById(bannerId) {
    assertValidObjectId(bannerId);
    let query = Banner.findById(bannerId);
    if (typeof query?.lean === 'function') {
      query = query.lean();
    }
    const banner = await query;
    if (!banner) throw ApiError.notFound('Banner not found');
    return formatAdminBanner(banner);
  }

  async create(bannerData, file) {
    const cleanTitle = String(bannerData.title || '').trim();
    if (!cleanTitle) {
      throw ApiError.badRequest('Banner title is required');
    }

    let image =
      bannerData.image?.url
        ? { url: bannerData.image.url, publicId: bannerData.image.publicId || '' }
        : bannerData.imageUrl
          ? { url: bannerData.imageUrl, publicId: '' }
          : null;

    if (file) {
      const uploaded = await uploadToCloudinary(file.buffer, 'banners');
      image = { url: uploaded.url, publicId: uploaded.publicId };
    }

    if (!image || !image.url) {
      image = { url: DEFAULT_FALLBACK_IMAGE_URL, publicId: '' };
    }

    const startDate = resolveDateField(bannerData.startDate) || new Date();
    const endDate = resolveDateField(bannerData.endDate);
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      throw ApiError.badRequest('End date must be on or after start date');
    }

    const slug = `${slugify(cleanTitle)}-${Math.floor(Math.random() * 10000)}`;
    const createPayload = { ...bannerData };
    delete createPayload.imageUrl;

    const created = await Banner.create({
      ...createPayload,
      title: cleanTitle,
      position: normalizeBannerPosition(bannerData.position) || 'home_hero',
      sortOrder: Math.max(0, Number(bannerData.sortOrder) || 0),
      isActive: bannerData.isActive !== undefined ? Boolean(bannerData.isActive) : true,
      startDate,
      endDate: endDate || null,
      image,
      slug,
    });

    return formatAdminBanner(created);
  }

  async update(bannerId, bannerData, file) {
    assertValidObjectId(bannerId);
    const banner = await Banner.findById(bannerId);
    if (!banner) throw ApiError.notFound('Banner not found');

    const updatePayload = { ...bannerData };
    const incomingImageUrl = updatePayload.imageUrl;
    delete updatePayload.imageUrl;

    if (updatePayload.position !== undefined) {
      updatePayload.position = normalizeBannerPosition(updatePayload.position) || banner.position;
    }

    if (file) {
      if (banner.image?.publicId) {
        await deleteFromCloudinary(banner.image.publicId).catch(() => {});
      }
      const uploaded = await uploadToCloudinary(file.buffer, 'banners');
      updatePayload.image = { url: uploaded.url, publicId: uploaded.publicId };
    } else if (incomingImageUrl && incomingImageUrl !== banner.image?.url) {
      if (banner.image?.publicId) {
        await deleteFromCloudinary(banner.image.publicId).catch(() => {});
      }
      updatePayload.image = { url: incomingImageUrl, publicId: '' };
    }

    const mergedStart =
      updatePayload.startDate !== undefined
        ? resolveDateField(updatePayload.startDate)
        : resolveDateField(banner.startDate);
    const mergedEnd =
      updatePayload.endDate !== undefined
        ? resolveDateField(updatePayload.endDate)
        : resolveDateField(banner.endDate);

    if (mergedStart && mergedEnd && mergedEnd.getTime() < mergedStart.getTime()) {
      throw ApiError.badRequest('End date must be on or after start date');
    }

    const updated = await Banner.findByIdAndUpdate(bannerId, updatePayload, {
      new: true,
      runValidators: true,
    });
    return formatAdminBanner(updated);
  }

  async toggleStatus(bannerId, isActive) {
    assertValidObjectId(bannerId);
    const banner = await Banner.findById(bannerId);
    if (!banner) throw ApiError.notFound('Banner not found');

    banner.isActive = typeof isActive === 'boolean' ? isActive : !banner.isActive;
    await banner.save();
    return formatAdminBanner(banner);
  }

  async delete(bannerId) {
    assertValidObjectId(bannerId);
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) throw ApiError.notFound('Banner not found');

    if (banner.image?.publicId) {
      await deleteFromCloudinary(banner.image.publicId).catch(() => {});
    }

    return { message: 'Banner deleted successfully' };
  }
}

export const adminBannerService = new AdminBannerService();
export default adminBannerService;
