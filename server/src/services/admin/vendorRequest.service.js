import mongoose from 'mongoose';
import { VendorRequest } from '../../models/VendorRequest.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { User } from '../../models/User.model.js';
import { VendorEarnings } from '../../models/VendorEarnings.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, slugify } from '../../utils/helpers.js';
import { VENDOR_STATUS, VENDOR_STATUS_LIST } from '../../constants/vendorStatus.constant.js';
import { ROLES } from '../../constants/roles.constant.js';
import { sendVendorStatusEmail } from '../../integrations/email/email.client.js';
import { notificationService } from '../common/notification.service.js';

const ensureValidObjectId = (id, label = 'Request ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

const toPlain = (doc) => (doc?.toObject ? doc.toObject() : { ...(doc || {}) });

const extractRequestUserId = (raw = {}) => {
  const candidate = raw.userId?._id || raw.userId || raw.user?._id || raw.user;
  return candidate && mongoose.isValidObjectId(candidate) ? String(candidate) : '';
};

const isPopulatedUser = (obj) =>
  Boolean(obj && typeof obj === 'object' && (obj.email || obj.fullName || obj.name));

const resolveLegacyRequestUsers = async (docs = []) => {
  if (mongoose.connection.readyState !== 1 || !Array.isArray(docs) || docs.length === 0) {
    return new Map();
  }

  const userIds = [];
  const emails = [];
  for (const doc of docs) {
    const raw = toPlain(doc);
    if (isPopulatedUser(raw.userId) || isPopulatedUser(raw.user)) continue;
    const uid = extractRequestUserId(raw);
    if (uid) userIds.push(uid);
    const email = String(raw.email || '').trim().toLowerCase();
    if (email) emails.push(email);
  }

  if (userIds.length === 0 && emails.length === 0) {
    return new Map();
  }

  const orConditions = [];
  if (userIds.length > 0) orConditions.push({ _id: { $in: userIds } });
  if (emails.length > 0) orConditions.push({ email: { $in: emails } });

  const users = await Promise.resolve()
    .then(() =>
      User.find({ $or: orConditions })
        .select('name fullName email phone avatar role isActive isEmailVerified googleId lastLogin')
        .lean()
    )
    .catch(() => []);

  const lookup = new Map();
  for (const u of users || []) {
    if (u?._id) lookup.set(`id:${String(u._id)}`, u);
    if (u?.email) lookup.set(`email:${String(u.email).trim().toLowerCase()}`, u);
  }
  return lookup;
};

const formatVendorRequest = (doc, userLookup = null) => {
  if (!doc) return null;
  const raw = toPlain(doc);

  let populatedUser = isPopulatedUser(raw.userId)
    ? toPlain(raw.userId)
    : isPopulatedUser(raw.user)
      ? toPlain(raw.user)
      : null;

  if (!populatedUser && userLookup instanceof Map) {
    const uid = extractRequestUserId(raw);
    const email = String(raw.email || '').trim().toLowerCase();
    populatedUser =
      (uid ? userLookup.get(`id:${uid}`) : null) ||
      (email ? userLookup.get(`email:${email}`) : null) ||
      null;
  }

  const reviewer =
    raw.reviewedBy && typeof raw.reviewedBy === 'object' ? toPlain(raw.reviewedBy) : null;

  const applicant =
    populatedUser?.fullName ||
    populatedUser?.name ||
    raw.applicant ||
    raw.ownerName ||
    raw.fullName ||
    (raw.email ? String(raw.email).split('@')[0] : '') ||
    '';

  const business = raw.shopName || raw.businessName || raw.storeName || '';
  const gstNumber = raw.taxId || raw.gstNumber || '';

  const rawAddress = raw.address || {};
  const bizAddress = raw.businessAddress || {};
  const mergedAddress = {
    addressLine1: rawAddress.addressLine1 || bizAddress.street || '',
    addressLine2: rawAddress.addressLine2 || '',
    street: bizAddress.street || rawAddress.addressLine1 || '',
    city: rawAddress.city || bizAddress.city || '',
    state: rawAddress.state || bizAddress.state || '',
    postalCode: rawAddress.postalCode || bizAddress.postalCode || '',
    country: rawAddress.country || bizAddress.country || '',
  };

  const normalizedStatus = String(
    raw.status ||
      (raw.isApproved === true
        ? VENDOR_STATUS.APPROVED
        : raw.rejectionReason
          ? VENDOR_STATUS.REJECTED
          : VENDOR_STATUS.PENDING)
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  const hasTax = Boolean(String(gstNumber).trim());
  const hasBank = Boolean(
    raw.bankDetails?.accountNumber && raw.bankDetails?.ifscCode
  );
  let documentStatus = 'Pending';
  if (normalizedStatus === VENDOR_STATUS.APPROVED) {
    documentStatus = 'Verified';
  } else if (normalizedStatus === VENDOR_STATUS.REJECTED) {
    documentStatus = 'Rejected';
  } else if (hasTax || hasBank) {
    documentStatus = 'Submitted';
  } else {
    documentStatus = 'Under review';
  }

  const resolvedUserRef = extractRequestUserId(raw) || (populatedUser?._id ? String(populatedUser._id) : '');
  const hasUserAccount = Boolean(populatedUser?._id || resolvedUserRef);
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
  } else if (resolvedUserRef) {
    userVerificationStatus = 'linked';
  }

  return {
    ...raw,
    status: normalizedStatus,
    storeName: raw.storeName || business,
    applicant,
    ownerName: applicant,
    business,
    shopName: business,
    gstNumber,
    taxId: gstNumber,
    documentStatus,
    address: mergedAddress,
    businessAddress: {
      street: mergedAddress.street,
      city: mergedAddress.city,
      state: mergedAddress.state,
      postalCode: mergedAddress.postalCode,
      country: mergedAddress.country,
    },
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
    reviewedByUser: reviewer
      ? {
          _id: reviewer._id,
          name: reviewer.fullName || reviewer.name || 'Admin',
          email: reviewer.email || '',
        }
      : undefined,
  };
};

const syncLegacyRequestFields = (request) => {
  if (!request) return;
  const legacyUser = request.get?.('user') || request.user;
  if (!request.userId && legacyUser) {
    request.userId = legacyUser?._id || legacyUser;
  }
  const fallbackStore =
    request.storeName ||
    request.get?.('shopName') ||
    request.shopName ||
    request.get?.('businessName') ||
    request.businessName;
  if (!request.storeName && fallbackStore) {
    request.storeName = fallbackStore;
  }
};

export class AdminVendorRequestService {
  async getRequests(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const activeFilter = { isDeleted: { $ne: true } };
    const filter = { ...activeFilter };
    const isConnected = mongoose.connection.readyState === 1;

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalized = String(params.status)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
      if (VENDOR_STATUS_LIST.includes(normalized)) {
        if (isConnected) {
          const statusRegex = new RegExp(`^${normalized.replace(/_/g, '[\\s_-]*')}$`, 'i');
          if (normalized === VENDOR_STATUS.APPROVED) {
            filter.$and = [
              {
                $or: [
                  { status: statusRegex },
                  { status: { $exists: false }, isApproved: true },
                ],
              },
            ];
          } else if (normalized === VENDOR_STATUS.PENDING) {
            filter.$and = [
              {
                $or: [
                  { status: statusRegex },
                  { status: /^submitted$/i },
                  {
                    status: { $exists: false },
                    isApproved: { $ne: true },
                    rejectionReason: { $in: [null, ''] },
                  },
                ],
              },
            ];
          } else {
            filter.status = statusRegex;
          }
        } else {
          filter.status = normalized;
        }
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
        { shopName: regex },
        { businessName: regex },
        { applicant: regex },
        { ownerName: regex },
        { email: regex },
        { phone: regex },
        { taxId: regex },
        { gstNumber: regex },
      ];
      if (matchedUserIds.length > 0) {
        searchClauses.push(
          { userId: { $in: matchedUserIds } },
          { user: { $in: matchedUserIds } }
        );
      }
      if (filter.$and) {
        filter.$and.push({ $or: searchClauses });
      } else {
        filter.$or = searchClauses;
      }
    }

    const statusMatch = (val) =>
      isConnected ? new RegExp(`^${String(val).replace(/_/g, '[\\s_-]*')}$`, 'i') : val;

    const [requests, total, totalAll, pendingCount, underReviewCount, approvedCount, rejectedCount] =
      await Promise.all([
        VendorRequest.find(filter)
          .populate(
            'userId',
            'name fullName email phone avatar role isActive isEmailVerified googleId lastLogin'
          )
          .populate('reviewedBy', 'name fullName email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        VendorRequest.countDocuments(filter),
        VendorRequest.countDocuments(activeFilter),
        VendorRequest.countDocuments({
          ...activeFilter,
          status: isConnected ? /^(pending|submitted)$/i : VENDOR_STATUS.PENDING,
        }),
        VendorRequest.countDocuments({
          ...activeFilter,
          status: statusMatch(VENDOR_STATUS.UNDER_REVIEW),
        }),
        VendorRequest.countDocuments({
          ...activeFilter,
          status: statusMatch(VENDOR_STATUS.APPROVED),
        }),
        VendorRequest.countDocuments({
          ...activeFilter,
          status: statusMatch(VENDOR_STATUS.REJECTED),
        }),
      ]);

    const userLookup = await resolveLegacyRequestUsers(requests);

    return {
      requests: requests.map((doc) => formatVendorRequest(doc, userLookup)),
      summary: {
        total: totalAll,
        pending: pendingCount,
        underReview: underReviewCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRequestById(requestId) {
    ensureValidObjectId(requestId, 'Vendor request ID');

    const request = await VendorRequest.findById(requestId)
      .populate(
        'userId',
        'name fullName email phone avatar role isActive isEmailVerified googleId lastLogin'
      )
      .populate('reviewedBy', 'name fullName email');

    if (!request) throw ApiError.notFound('Vendor request not found');
    const userLookup = await resolveLegacyRequestUsers([request]);
    return formatVendorRequest(request, userLookup);
  }

  async approveRequest(requestId, adminId) {
    ensureValidObjectId(requestId, 'Vendor request ID');

    const request = await VendorRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Vendor request not found');

    syncLegacyRequestFields(request);
    request.status = VENDOR_STATUS.APPROVED;
    request.rejectionReason = '';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save({ validateModifiedOnly: true });

    // Build store address safely from either businessAddress or address
    const reqAddr = request.businessAddress || {};
    const altAddr = request.address || {};
    const storeAddress = {
      street: reqAddr.street || altAddr.addressLine1 || '',
      city: reqAddr.city || altAddr.city || '',
      state: reqAddr.state || altAddr.state || '',
      postalCode: reqAddr.postalCode || altAddr.postalCode || '',
      country: reqAddr.country || altAddr.country || '',
    };

    const baseSlug = slugify(request.storeName || request.shopName || 'store') || 'store';
    let slug = baseSlug;
    let counter = 1;
    while (await Vendor.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const vendorQuery =
      mongoose.connection.readyState === 1
        ? { $or: [{ userId: request.userId }, { user: request.userId }] }
        : { userId: request.userId };
    let vendor = await Vendor.findOne(vendorQuery);
    if (!vendor) {
      vendor = await Vendor.create({
        userId: request.userId,
        storeName: request.storeName || request.shopName || request.businessName,
        slug,
        email: request.email,
        phone: request.phone,
        website: request.website || '',
        businessType: request.businessType || '',
        description: request.description || '',
        address: storeAddress,
        businessDetails: {
          taxNumber: request.taxId || '',
          bankAccount: request.bankDetails
            ? {
                accountHolderName: request.bankDetails.accountHolderName || '',
                accountNumber: request.bankDetails.accountNumber || '',
                bankName: request.bankDetails.bankName || '',
                ifscCode: request.bankDetails.ifscCode || '',
              }
            : {},
        },
        status: VENDOR_STATUS.APPROVED,
        isActive: true,
        rejectionReason: '',
      });
    } else {
      vendor.userId = vendor.userId || request.userId;
      vendor.storeName = vendor.storeName || request.storeName || request.shopName || request.businessName;
      vendor.status = VENDOR_STATUS.APPROVED;
      vendor.isActive = true;
      vendor.rejectionReason = '';
      if (!vendor.slug) vendor.slug = slug;
      if (!vendor.website && request.website) vendor.website = request.website;
      if (!vendor.businessType && request.businessType) {
        vendor.businessType = request.businessType;
      }
      if (!vendor.businessDetails?.taxNumber && request.taxId) {
        vendor.businessDetails = {
          ...(vendor.businessDetails?.toObject?.() || vendor.businessDetails || {}),
          taxNumber: request.taxId,
        };
      }
      await vendor.save({ validateModifiedOnly: true });
    }

    await VendorEarnings.findOneAndUpdate(
      { vendorId: vendor._id },
      { $setOnInsert: { vendorId: vendor._id } },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(request.userId, {
      role: ROLES.VENDOR,
      vendorId: vendor._id,
    });

    sendVendorStatusEmail(request.email, request.storeName, 'approved').catch(() => {});

    notificationService
      .createNotification({
        userId: request.userId,
        title: 'Seller Application Approved',
        message: `Congratulations! Your seller application for "${request.storeName}" has been approved.`,
        type: 'vendor',
        link: '/vendor',
        data: { requestId: request._id, vendorId: vendor._id, status: VENDOR_STATUS.APPROVED },
      })
      .catch(() => {});

    const hydratedRequest = await this.getRequestById(request._id).catch(() =>
      formatVendorRequest(request)
    );
    return { request: hydratedRequest, vendor };
  }

  async rejectRequest(requestId, adminId, reason = 'Application rejected') {
    ensureValidObjectId(requestId, 'Vendor request ID');

    const request = await VendorRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Vendor request not found');

    syncLegacyRequestFields(request);
    const finalReason = String(reason || '').trim() || 'Application rejected by admin';
    request.status = VENDOR_STATUS.REJECTED;
    request.rejectionReason = finalReason;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save({ validateModifiedOnly: true });

    if (request.userId) {
      const vendorFilter =
        mongoose.connection.readyState === 1
          ? { $or: [{ userId: request.userId }, { user: request.userId }] }
          : { userId: request.userId };
      await Promise.resolve()
        .then(() =>
          Vendor.updateOne(
            vendorFilter,
            { status: VENDOR_STATUS.REJECTED, isActive: false, rejectionReason: finalReason }
          )
        )
        .catch(() => {});
      await Promise.resolve()
        .then(() =>
          User.updateOne(
            { _id: request.userId, role: ROLES.VENDOR },
            { $set: { role: ROLES.USER }, $unset: { vendorId: 1 } }
          )
        )
        .catch(() => {});
    }

    sendVendorStatusEmail(request.email, request.storeName, 'rejected', finalReason).catch(() => {});

    notificationService
      .createNotification({
        userId: request.userId,
        title: 'Seller Application Rejected',
        message: `Your seller application for "${request.storeName}" was rejected.${finalReason ? ` Reason: ${finalReason}` : ''}`,
        type: 'vendor',
        link: '/seller/request-status',
        data: { requestId: request._id, status: VENDOR_STATUS.REJECTED },
      })
      .catch(() => {});

    return this.getRequestById(request._id).catch(() => formatVendorRequest(request));
  }

  async reviewRequest(requestId, adminId, reviewData = {}) {
    ensureValidObjectId(requestId, 'Vendor request ID');

    const request = await VendorRequest.findById(requestId);
    if (!request) throw ApiError.notFound('Vendor request not found');

    syncLegacyRequestFields(request);
    request.status = VENDOR_STATUS.UNDER_REVIEW;
    if (reviewData.notes !== undefined) {
      request.reviewNotes = String(reviewData.notes).trim();
    }
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save({ validateModifiedOnly: true });

    notificationService
      .createNotification({
        userId: request.userId,
        title: 'Seller Application Under Review',
        message: `Your seller application for "${request.storeName}" is now under review.`,
        type: 'vendor',
        link: '/seller/request-status',
        data: { requestId: request._id, status: VENDOR_STATUS.UNDER_REVIEW },
      })
      .catch(() => {});

    return this.getRequestById(request._id).catch(() => formatVendorRequest(request));
  }

  async restoreRequest(requestId) {
    ensureValidObjectId(requestId, 'Vendor request ID');

    const request = await VendorRequest.findByIdAndUpdate(
      requestId,
      { isDeleted: false },
      { new: true }
    );
    if (!request) throw ApiError.notFound('Vendor request not found');
    return formatVendorRequest(request);
  }

  async deleteRequest(requestId) {
    ensureValidObjectId(requestId, 'Vendor request ID');

    const request = await VendorRequest.findByIdAndUpdate(
      requestId,
      { isDeleted: true },
      { new: true }
    );
    if (!request) throw ApiError.notFound('Vendor request not found');
    return { message: 'Vendor request archived successfully', deletedRequestId: request._id };
  }
}

export const adminVendorRequestService = new AdminVendorRequestService();
export default adminVendorRequestService;
