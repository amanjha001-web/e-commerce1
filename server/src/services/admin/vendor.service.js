import mongoose from 'mongoose';
import { Vendor } from '../../models/Vendor.model.js';
import { User } from '../../models/User.model.js';
import { Product } from '../../models/Product.model.js';
import { Order } from '../../models/Order.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { VendorRequest } from '../../models/VendorRequest.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, slugify } from '../../utils/helpers.js';
import { VENDOR_STATUS, VENDOR_STATUS_LIST } from '../../constants/vendorStatus.constant.js';
import { ROLES } from '../../constants/roles.constant.js';
import { sendVendorStatusEmail } from '../../integrations/email/email.client.js';
import { notificationService } from '../common/notification.service.js';

const ensureValidObjectId = (id, label = 'Vendor ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const normalizeVendorStatus = (status) => {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (!normalized || !VENDOR_STATUS_LIST.includes(normalized)) {
    throw ApiError.badRequest(`Invalid vendor status: ${status}`);
  }

  return normalized;
};

const toPlainObject = (doc) => (doc?.toObject ? doc.toObject() : { ...(doc || {}) });

const buildAdminVendorPayload = (vendorDoc, maps = {}, extras = {}) => {
  const raw = toPlainObject(vendorDoc);
  const idKey = String(raw._id || '');
  const populatedUser =
    raw.userId && typeof raw.userId === 'object' ? toPlainObject(raw.userId) : null;
  const userKey = String(populatedUser?._id || raw.userId || '');

  const productCount = maps.productCounts?.get(idKey) ?? raw.productCount ?? raw.productsCount ?? 0;
  const orderStats = maps.orderStats?.get(idKey) || { orderCount: 0, grossSales: 0 };
  const earnings = maps.earningsMap?.get(idKey) || null;
  const vendorReq = maps.requestMap?.get(userKey) || null;

  const isActive = raw.isActive !== false;
  const rawStatus = raw.status || VENDOR_STATUS.PENDING;
  const rawAddress = raw.address || {};
  const fallbackAddress = vendorReq?.address || vendorReq?.businessAddress || {};

  const street = rawAddress.street || rawAddress.addressLine1 || fallbackAddress.street || fallbackAddress.addressLine1 || '';
  const city = rawAddress.city || fallbackAddress.city || '';
  const state = rawAddress.state || fallbackAddress.state || '';
  const postalCode =
    rawAddress.postalCode ||
    rawAddress.pincode ||
    fallbackAddress.postalCode ||
    '';
  const country = rawAddress.country || fallbackAddress.country || '';

  const taxNumber =
    raw.businessDetails?.taxNumber ||
    raw.gstNumber ||
    vendorReq?.taxId ||
    '';
  const businessLicense = raw.businessDetails?.businessLicense || '';
  const bankAccount =
    raw.businessDetails?.bankAccount ||
    vendorReq?.bankDetails ||
    {};

  const ownerName =
    populatedUser?.fullName ||
    populatedUser?.name ||
    raw.ownerName ||
    '';
  const email = raw.email || populatedUser?.email || vendorReq?.email || '';
  const phone = raw.phone || populatedUser?.phone || vendorReq?.phone || '';
  const totalRevenue =
    earnings?.totalRevenue ?? orderStats.grossSales ?? raw.totalRevenue ?? raw.revenue ?? 0;

  let displayStatus = rawStatus;
  if (!isActive && rawStatus === VENDOR_STATUS.APPROVED) {
    displayStatus = VENDOR_STATUS.SUSPENDED;
  } else if (!isActive && rawStatus === VENDOR_STATUS.PENDING) {
    displayStatus = 'inactive';
  }

  const hasUserAccount = Boolean(populatedUser?._id || raw.userId);
  const isUserVerified = Boolean(populatedUser?.isEmailVerified);
  const isUserActive = populatedUser ? populatedUser.isActive !== false : null;
  let userVerificationStatus = 'unlinked';
  if (populatedUser) {
    if (populatedUser.isActive === false) {
      userVerificationStatus = 'blocked';
    } else if (populatedUser.isEmailVerified) {
      userVerificationStatus = 'verified';
    } else {
      userVerificationStatus = 'unverified';
    }
  } else if (raw.userId) {
    userVerificationStatus = 'linked';
  }

  return {
    ...raw,
    shopName: raw.storeName || raw.shopName || '',
    shopDescription: raw.description ?? raw.shopDescription ?? '',
    ownerName,
    hasUserAccount,
    isUserVerified,
    isUserActive,
    userVerificationStatus,
    user: populatedUser
      ? {
          _id: populatedUser._id,
          name: populatedUser.name || populatedUser.fullName || '',
          fullName: populatedUser.fullName || populatedUser.name || '',
          email: populatedUser.email || '',
          phone: populatedUser.phone || '',
          avatar: populatedUser.avatar || '',
          role: populatedUser.role,
          isActive: populatedUser.isActive !== false,
          isEmailVerified: Boolean(populatedUser.isEmailVerified),
          isVerified: Boolean(populatedUser.isEmailVerified),
          lastLogin: populatedUser.lastLogin || null,
          authProvider: populatedUser.googleId ? 'google' : 'email',
        }
      : undefined,
    email,
    phone,
    website: raw.website || vendorReq?.website || '',
    businessType: raw.businessType || vendorReq?.businessType || '',
    gstNumber: taxNumber,
    taxId: taxNumber,
    businessLicense,
    bankAccount,
    address: {
      street,
      city,
      state,
      postalCode,
      pincode: postalCode,
      country,
    },
    isActive,
    status: rawStatus,
    displayStatus,
    productCount,
    productsCount: productCount,
    orderCount: orderStats.orderCount ?? raw.orderCount ?? raw.ordersCount ?? 0,
    ordersCount: orderStats.orderCount ?? raw.orderCount ?? raw.ordersCount ?? 0,
    totalRevenue,
    revenue: totalRevenue,
    netEarnings: earnings?.netEarnings ?? 0,
    availableBalance: earnings?.availableBalance ?? 0,
    totalCommission: earnings?.totalCommission ?? 0,
    totalWithdrawn: earnings?.totalWithdrawn ?? 0,
    averageRating: raw.rating ?? 0,
    ...(extras.recentProducts !== undefined ? { recentProducts: extras.recentProducts } : {}),
    ...(extras.recentOrders !== undefined ? { recentOrders: extras.recentOrders } : {}),
  };
};

const enrichAdminVendors = async (vendorDocs = []) => {
  if (!vendorDocs || vendorDocs.length === 0) return [];

  const vendorIds = vendorDocs.map((v) => v._id).filter(Boolean);
  const userIds = vendorDocs
    .map((v) => (v.userId && typeof v.userId === 'object' ? v.userId._id : v.userId))
    .filter(Boolean);

  const [productAggRes, orderAggRes, earningsRes, requestsRes] = await Promise.allSettled([
    Promise.resolve().then(() =>
      Product.aggregate([
        { $match: { vendorId: { $in: vendorIds } } },
        { $group: { _id: '$vendorId', count: { $sum: 1 } } },
      ])
    ),
    Promise.resolve().then(() =>
      Order.aggregate([
        { $match: { 'items.vendorId': { $in: vendorIds } } },
        { $unwind: '$items' },
        { $match: { 'items.vendorId': { $in: vendorIds } } },
        {
          $group: {
            _id: { vendorId: '$items.vendorId', orderId: '$_id' },
            grossSales: { $sum: '$items.total' },
          },
        },
        {
          $group: {
            _id: '$_id.vendorId',
            orderCount: { $sum: 1 },
            grossSales: { $sum: '$grossSales' },
          },
        },
      ])
    ),
    Promise.resolve().then(() => VendorEarnings.find({ vendorId: { $in: vendorIds } }).lean()),
    userIds.length
      ? Promise.resolve().then(() =>
          VendorRequest.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean()
        )
      : Promise.resolve([]),
  ]);

  const productCounts = new Map();
  if (productAggRes.status === 'fulfilled' && Array.isArray(productAggRes.value)) {
    for (const row of productAggRes.value) {
      if (row?._id) productCounts.set(String(row._id), Number(row.count || 0));
    }
  }

  const orderStats = new Map();
  if (orderAggRes.status === 'fulfilled' && Array.isArray(orderAggRes.value)) {
    for (const row of orderAggRes.value) {
      if (row?._id) {
        orderStats.set(String(row._id), {
          orderCount: Number(row.orderCount || 0),
          grossSales: Number(row.grossSales || 0),
        });
      }
    }
  }

  const earningsMap = new Map();
  if (earningsRes.status === 'fulfilled' && Array.isArray(earningsRes.value)) {
    for (const e of earningsRes.value) {
      if (e?.vendorId) earningsMap.set(String(e.vendorId), e);
    }
  }

  const requestMap = new Map();
  if (requestsRes.status === 'fulfilled' && Array.isArray(requestsRes.value)) {
    for (const req of requestsRes.value) {
      const uid = String(req?.userId || '');
      if (uid && !requestMap.has(uid)) {
        requestMap.set(uid, req);
      }
    }
  }

  return vendorDocs.map((v) =>
    buildAdminVendorPayload(v, { productCounts, orderStats, earningsMap, requestMap })
  );
};

const ensureVendorRequiredDefaults = async (vendor) => {
  if (!vendor) return;

  if (!vendor.slug) {
    const baseSlug = slugify(vendor.storeName || vendor.shopName || 'vendor') || 'vendor';
    let candidate = baseSlug;
    let counter = 1;
    // Check uniqueness safely so legacy records missing slug never collide
    while (
      await Promise.resolve()
        .then(() => Vendor.findOne({ slug: candidate, _id: { $ne: vendor._id } }).select('_id').lean())
        .catch(() => null)
    ) {
      candidate = `${baseSlug}-${counter++}`;
    }
    vendor.slug = candidate;
  }

  if (!vendor.userId && vendor.email) {
    const matchedUser = await Promise.resolve()
      .then(() =>
        User.findOne({ email: String(vendor.email).trim().toLowerCase() })
          .select('_id')
          .lean()
      )
      .catch(() => null);
    if (matchedUser?._id) {
      vendor.userId = matchedUser._id;
    }
  }
};

const elevateApprovedVendorAccount = async (vendor) => {
  if (!vendor) return;
  if (vendor.userId) {
    await User.findByIdAndUpdate(vendor.userId, {
      role: ROLES.VENDOR,
      vendorId: vendor._id,
    });
  }
  await VendorEarnings.findOneAndUpdate(
    { vendorId: vendor._id },
    { $setOnInsert: { vendorId: vendor._id } },
    { upsert: true, new: true }
  );
};

export class AdminVendorService {
  async getVendors(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalizedStatus = String(params.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');

      if (normalizedStatus === 'inactive') {
        filter.isActive = false;
      } else if (normalizedStatus === 'active' || normalizedStatus === VENDOR_STATUS.APPROVED) {
        filter.status = VENDOR_STATUS.APPROVED;
        filter.isActive = { $ne: false };
      } else if (normalizedStatus === VENDOR_STATUS.SUSPENDED) {
        filter.$or = [
          { status: VENDOR_STATUS.SUSPENDED },
          { status: VENDOR_STATUS.APPROVED, isActive: false },
        ];
      } else if (VENDOR_STATUS_LIST.includes(normalizedStatus)) {
        filter.status = normalizedStatus;
      }
    }

    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      const matchingUsers = await Promise.resolve()
        .then(() =>
          User.find({
            $or: [{ name: regex }, { fullName: regex }, { email: regex }],
          })
            .select('_id')
            .lean()
        )
        .catch(() => []);
      const matchedUserIds = (matchingUsers || []).map((u) => u._id);

      const searchClauses = [
        { storeName: regex },
        { email: regex },
        { phone: regex },
        { slug: regex },
      ];
      if (matchedUserIds.length > 0) {
        searchClauses.push({ userId: { $in: matchedUserIds } });
      }

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchClauses }];
        delete filter.$or;
      } else {
        filter.$or = searchClauses;
      }
    }

    const [
      vendors,
      total,
      totalAll,
      approvedCount,
      pendingCount,
      suspendedCount,
      rejectedCount,
      inactiveCount,
    ] = await Promise.all([
      Vendor.find(filter)
        .populate(
          'userId',
          'name fullName email phone avatar role isActive isEmailVerified googleId lastLogin vendorId'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Vendor.countDocuments(filter),
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: VENDOR_STATUS.APPROVED, isActive: { $ne: false } }),
      Vendor.countDocuments({ status: { $in: [VENDOR_STATUS.PENDING, VENDOR_STATUS.UNDER_REVIEW] } }),
      Vendor.countDocuments({
        $or: [
          { status: VENDOR_STATUS.SUSPENDED },
          { status: VENDOR_STATUS.APPROVED, isActive: false },
        ],
      }),
      Vendor.countDocuments({ status: VENDOR_STATUS.REJECTED }),
      Vendor.countDocuments({ isActive: false }),
    ]);

    const enrichedVendors = await enrichAdminVendors(vendors);

    return {
      vendors: enrichedVendors,
      summary: {
        total: totalAll,
        approved: approvedCount,
        pending: pendingCount,
        suspended: suspendedCount,
        rejected: rejectedCount,
        inactive: inactiveCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorById(vendorId) {
    ensureValidObjectId(vendorId, 'Vendor ID');

    const vendor = await Vendor.findById(vendorId).populate(
      'userId',
      'name fullName email phone avatar role isActive isEmailVerified googleId lastLogin vendorId'
    );
    if (!vendor) throw ApiError.notFound('Vendor not found');

    const [enrichedList, recentProductsRes, recentOrdersRes] = await Promise.all([
      enrichAdminVendors([vendor]),
      Promise.resolve()
        .then(() =>
          Product.find({ vendorId: vendor._id })
            .select('name price stock status images createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        )
        .catch(() => []),
      Promise.resolve()
        .then(() =>
          Order.find({ 'items.vendorId': vendor._id })
            .select('orderNumber orderStatus totalAmount createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        )
        .catch(() => []),
    ]);

    const base = enrichedList[0] || buildAdminVendorPayload(vendor);
    return {
      ...base,
      recentProducts: Array.isArray(recentProductsRes) ? recentProductsRes : [],
      recentOrders: Array.isArray(recentOrdersRes) ? recentOrdersRes : [],
    };
  }

  async updateVendor(vendorId, updateData = {}) {
    ensureValidObjectId(vendorId, 'Vendor ID');

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    const nextStoreName = updateData.storeName ?? updateData.shopName;
    if (nextStoreName !== undefined && String(nextStoreName).trim()) {
      vendor.storeName = String(nextStoreName).trim();
    }

    const nextDescription =
      updateData.description ?? updateData.shopDescription ?? updateData.storeDescription;
    if (nextDescription !== undefined) {
      vendor.description = String(nextDescription).trim();
    }

    if (updateData.email !== undefined) {
      const trimmedEmail = String(updateData.email).trim().toLowerCase();
      if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        throw ApiError.badRequest('Please provide a valid email address');
      }
      vendor.email = trimmedEmail;
    }
    if (updateData.phone !== undefined) {
      vendor.phone = String(updateData.phone).trim();
    }
    if (updateData.website !== undefined) {
      vendor.website = String(updateData.website).trim();
    }
    if (updateData.businessType !== undefined) {
      vendor.businessType = String(updateData.businessType).trim();
    }

    if (updateData.address && typeof updateData.address === 'object') {
      const currentAddr = vendor.address?.toObject ? vendor.address.toObject() : vendor.address || {};
      vendor.address = {
        street: updateData.address.street ?? updateData.address.addressLine1 ?? currentAddr.street ?? '',
        city: updateData.address.city ?? currentAddr.city ?? '',
        state: updateData.address.state ?? currentAddr.state ?? '',
        postalCode:
          updateData.address.postalCode ?? updateData.address.pincode ?? currentAddr.postalCode ?? '',
        country: updateData.address.country ?? currentAddr.country ?? '',
      };
    }

    const nextTaxNumber = updateData.gstNumber ?? updateData.taxNumber ?? updateData.businessDetails?.taxNumber;
    const nextBusinessLicense = updateData.businessLicense ?? updateData.businessDetails?.businessLicense;
    const nextBank = updateData.bankAccount ?? updateData.businessDetails?.bankAccount;
    if (nextTaxNumber !== undefined || nextBusinessLicense !== undefined || nextBank !== undefined) {
      const currentBiz = vendor.businessDetails?.toObject
        ? vendor.businessDetails.toObject()
        : vendor.businessDetails || {};
      vendor.businessDetails = {
        ...currentBiz,
        ...(nextTaxNumber !== undefined ? { taxNumber: String(nextTaxNumber).trim() } : {}),
        ...(nextBusinessLicense !== undefined
          ? { businessLicense: String(nextBusinessLicense).trim() }
          : {}),
        ...(nextBank && typeof nextBank === 'object'
          ? { bankAccount: { ...(currentBiz.bankAccount || {}), ...nextBank } }
          : {}),
      };
    }

    if (updateData.commissionRate !== undefined && updateData.commissionRate !== '') {
      const rate = Number(updateData.commissionRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        throw ApiError.badRequest('Commission rate must be between 0 and 100');
      }
      vendor.commissionRate = rate;
    }

    if (updateData.rejectionReason !== undefined) {
      vendor.rejectionReason = String(updateData.rejectionReason).trim();
    }

    const previousStatus = vendor.status;
    if (updateData.status !== undefined && updateData.status !== '') {
      const nextStatus = normalizeVendorStatus(updateData.status);
      vendor.status = nextStatus;
      if (updateData.isActive !== undefined) {
        vendor.isActive = Boolean(updateData.isActive);
      } else if (nextStatus === VENDOR_STATUS.APPROVED) {
        vendor.isActive = true;
        if (updateData.rejectionReason === undefined) {
          vendor.rejectionReason = '';
        }
      } else if ([VENDOR_STATUS.REJECTED, VENDOR_STATUS.SUSPENDED].includes(nextStatus)) {
        vendor.isActive = false;
      }
    } else if (updateData.isActive !== undefined) {
      vendor.isActive = Boolean(updateData.isActive);
    }

    await ensureVendorRequiredDefaults(vendor);
    await vendor.save({ validateModifiedOnly: true });

    if (vendor.status === VENDOR_STATUS.APPROVED && previousStatus !== VENDOR_STATUS.APPROVED) {
      await elevateApprovedVendorAccount(vendor);
    }

    if (vendor.userId && vendor.status !== previousStatus) {
      if (vendor.status === VENDOR_STATUS.APPROVED) {
        notificationService
          .createNotification({
            userId: vendor.userId,
            title: 'Vendor Store Approved',
            message: `Your store "${vendor.storeName}" has been approved and is now active.`,
            type: 'vendor',
            link: '/vendor',
            data: { vendorId: vendor._id, status: VENDOR_STATUS.APPROVED },
          })
          .catch(() => {});
      } else if ([VENDOR_STATUS.REJECTED, VENDOR_STATUS.SUSPENDED].includes(vendor.status)) {
        notificationService
          .createNotification({
            userId: vendor.userId,
            title: `Vendor Store ${vendor.status === VENDOR_STATUS.REJECTED ? 'Rejected' : 'Suspended'}`,
            message: `Your store "${vendor.storeName}" was ${vendor.status}.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : ''}`,
            type: 'vendor',
            link: '/vendor',
            data: { vendorId: vendor._id, status: vendor.status },
          })
          .catch(() => {});
      }
    }

    return this.getVendorById(vendor._id);
  }

  async toggleVendorStatus(vendorId, isActiveOrPayload) {
    ensureValidObjectId(vendorId, 'Vendor ID');

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    const payload =
      typeof isActiveOrPayload === 'object' && isActiveOrPayload !== null
        ? isActiveOrPayload
        : { isActive: isActiveOrPayload };

    const previousStatus = vendor.status;

    if (payload.status !== undefined && payload.status !== '') {
      const nextStatus = normalizeVendorStatus(payload.status);
      vendor.status = nextStatus;
      if (payload.isActive !== undefined) {
        vendor.isActive = Boolean(payload.isActive);
      } else if (nextStatus === VENDOR_STATUS.APPROVED) {
        vendor.isActive = true;
        vendor.rejectionReason = '';
      } else if ([VENDOR_STATUS.REJECTED, VENDOR_STATUS.SUSPENDED].includes(nextStatus)) {
        vendor.isActive = false;
      }
    } else {
      const nextActive = payload.isActive !== undefined ? Boolean(payload.isActive) : !vendor.isActive;
      vendor.isActive = nextActive;
      if (!nextActive && vendor.status === VENDOR_STATUS.APPROVED) {
        vendor.status = VENDOR_STATUS.SUSPENDED;
      } else if (nextActive && vendor.status === VENDOR_STATUS.SUSPENDED) {
        vendor.status = VENDOR_STATUS.APPROVED;
      }
    }

    if (payload.commissionRate !== undefined && payload.commissionRate !== '') {
      const rate = Number(payload.commissionRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        throw ApiError.badRequest('Commission rate must be between 0 and 100');
      }
      vendor.commissionRate = rate;
    }

    if (payload.rejectionReason !== undefined) {
      vendor.rejectionReason = String(payload.rejectionReason).trim();
    }

    await ensureVendorRequiredDefaults(vendor);
    await vendor.save({ validateModifiedOnly: true });

    if (vendor.status === VENDOR_STATUS.APPROVED) {
      await elevateApprovedVendorAccount(vendor);
      if (previousStatus !== VENDOR_STATUS.APPROVED) {
        const user = vendor.userId ? await User.findById(vendor.userId) : null;
        if (user) {
          sendVendorStatusEmail(user.email, vendor.storeName, 'approved').catch(() => {});
        }
        if (vendor.userId) {
          notificationService
            .createNotification({
              userId: vendor.userId,
              title: 'Vendor Store Approved',
              message: `Your store "${vendor.storeName}" has been approved and is now active.`,
              type: 'vendor',
              link: '/vendor',
              data: { vendorId: vendor._id, status: VENDOR_STATUS.APPROVED },
            })
            .catch(() => {});
        }
      }
    } else if (
      vendor.status !== previousStatus &&
      [VENDOR_STATUS.REJECTED, VENDOR_STATUS.SUSPENDED].includes(vendor.status)
    ) {
      const reasonText = vendor.rejectionReason || `Store marked as ${vendor.status} by admin`;
      const user = vendor.userId ? await User.findById(vendor.userId) : null;
      if (user) {
        sendVendorStatusEmail(user.email, vendor.storeName, vendor.status, reasonText).catch(() => {});
      }
      if (vendor.userId) {
        notificationService
          .createNotification({
            userId: vendor.userId,
            title: `Vendor Store ${vendor.status === VENDOR_STATUS.REJECTED ? 'Rejected' : 'Suspended'}`,
            message: `Your store "${vendor.storeName}" was ${vendor.status}.${vendor.rejectionReason ? ` Reason: ${vendor.rejectionReason}` : ''}`,
            type: 'vendor',
            link: '/vendor',
            data: { vendorId: vendor._id, status: vendor.status },
          })
          .catch(() => {});
      }
    }

    return this.getVendorById(vendor._id);
  }

  async approveVendor(vendorId) {
    ensureValidObjectId(vendorId, 'Vendor ID');

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    vendor.status = VENDOR_STATUS.APPROVED;
    vendor.isActive = true;
    vendor.rejectionReason = '';
    await ensureVendorRequiredDefaults(vendor);
    await vendor.save({ validateModifiedOnly: true });

    await elevateApprovedVendorAccount(vendor);

    const user = vendor.userId ? await User.findById(vendor.userId) : null;
    if (user) {
      sendVendorStatusEmail(user.email, vendor.storeName, 'approved').catch(() => {});
    }

    if (vendor.userId) {
      notificationService
        .createNotification({
          userId: vendor.userId,
          title: 'Vendor Store Approved',
          message: `Congratulations! Your store "${vendor.storeName}" has been approved.`,
          type: 'vendor',
          link: '/vendor',
          data: { vendorId: vendor._id, status: VENDOR_STATUS.APPROVED },
        })
        .catch(() => {});
    }

    return this.getVendorById(vendor._id);
  }

  async rejectVendor(vendorId, reason = 'Application rejected by admin') {
    ensureValidObjectId(vendorId, 'Vendor ID');

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    const finalReason = String(reason || '').trim() || 'Application rejected by admin';
    vendor.status = VENDOR_STATUS.REJECTED;
    vendor.isActive = false;
    vendor.rejectionReason = finalReason;
    await ensureVendorRequiredDefaults(vendor);
    await vendor.save({ validateModifiedOnly: true });

    const user = vendor.userId ? await User.findById(vendor.userId) : null;
    if (user) {
      sendVendorStatusEmail(user.email, vendor.storeName, 'rejected', finalReason).catch(() => {});
    }

    if (vendor.userId) {
      notificationService
        .createNotification({
          userId: vendor.userId,
          title: 'Vendor Application Rejected',
          message: `Your store "${vendor.storeName}" application was rejected. Reason: ${finalReason}`,
          type: 'vendor',
          link: '/vendor',
          data: { vendorId: vendor._id, status: VENDOR_STATUS.REJECTED },
        })
        .catch(() => {});
    }

    return this.getVendorById(vendor._id);
  }

  async deleteVendor(vendorId) {
    ensureValidObjectId(vendorId, 'Vendor ID');

    const vendor = await Vendor.findByIdAndDelete(vendorId);
    if (!vendor) throw ApiError.notFound('Vendor not found');

    await Promise.resolve()
      .then(() => Product.updateMany({ vendorId: vendor._id }, { isActive: false }))
      .catch(() => {});

    if (vendor.userId) {
      await Promise.resolve()
        .then(() =>
          User.updateOne(
            { _id: vendor.userId, role: ROLES.VENDOR },
            { $set: { role: ROLES.USER }, $unset: { vendorId: 1 } }
          )
        )
        .catch(() => {});
      await Promise.resolve()
        .then(() =>
          User.updateOne(
            { _id: vendor.userId, vendorId: vendor._id },
            { $unset: { vendorId: 1 } }
          )
        )
        .catch(() => {});

      notificationService
        .createNotification({
          userId: vendor.userId,
          title: 'Vendor Store Removed',
          message: `Your vendor store "${vendor.storeName || 'Store'}" has been removed by an administrator.`,
          type: 'vendor',
          link: '/',
          data: { deletedVendorId: vendor._id },
        })
        .catch(() => {});
    }

    return {
      message: 'Vendor deleted successfully',
      deletedVendorId: vendor._id,
    };
  }
}

export const adminVendorService = new AdminVendorService();
export default adminVendorService;
