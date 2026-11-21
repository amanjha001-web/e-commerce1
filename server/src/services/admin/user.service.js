import mongoose from 'mongoose';
import { User } from '../../models/User.model.js';
import { Address } from '../../models/Address.model.js';
import { Order } from '../../models/Order.model.js';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { VendorRequest } from '../../models/VendorRequest.model.js';
import { Vendor } from '../../models/Vendor.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, sanitizeUser } from '../../utils/helpers.js';
import { ROLES, ADMIN_ROLES } from '../../constants/roles.constant.js';
import { ORDER_STATUS } from '../../constants/orderStatus.constant.js';

const NON_SPEND_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.RETURNED,
];

const formatAdminUser = (user) => {
  const clean = sanitizeUser(user);
  if (!clean) return null;

  const isActive =
    clean.isActive !== false &&
    clean.isBlocked !== true &&
    String(clean.status || '').trim().toLowerCase() !== 'blocked';
  const normalizedRole = clean.role
    ? String(clean.role).trim().toLowerCase()
    : ROLES.USER;
  const vendorObj =
    clean.vendorId && typeof clean.vendorId === 'object' ? clean.vendorId : null;

  return {
    ...clean,
    fullName: clean.fullName || clean.name || '',
    name: clean.name || clean.fullName || '',
    phone: clean.phone || clean.mobile || '',
    role: normalizedRole,
    vendorId: vendorObj
      ? {
          ...vendorObj,
          storeName: vendorObj.storeName || vendorObj.shopName || '',
          shopName: vendorObj.shopName || vendorObj.storeName || '',
          slug: vendorObj.slug || vendorObj.shopSlug || '',
        }
      : clean.vendorId,
    isActive,
    isBlocked: !isActive,
    status: isActive ? 'active' : 'blocked',
    isVerified: Boolean(clean.isEmailVerified ?? clean.isVerified),
    authProvider: clean.googleId ? 'google' : 'email',
  };
};

const ensureValidObjectId = (id, label = 'User ID') => {
  if (!id || !mongoose.isValidObjectId(id)) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
};

export class AdminUserService {
  async getUsers(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};
    const andClauses = [];
    const isConnected = mongoose.connection.readyState === 1;

    const customerRoleFilter = isConnected
      ? {
          $or: [
            { role: { $regex: /^(user|customer)$/i } },
            { role: { $exists: false } },
            { role: null },
            { role: '' },
          ],
        }
      : { role: { $in: [ROLES.USER, 'customer'] } };
    const vendorRoleFilter = isConnected
      ? { $or: [{ role: { $regex: /^vendor$/i } }, { vendorId: { $ne: null } }] }
      : { role: ROLES.VENDOR };
    const adminRoleFilter = isConnected
      ? { role: { $regex: /^(admin|super[_\s-]*admin)$/i } }
      : { role: { $in: [...ADMIN_ROLES, 'ADMIN', 'SUPER_ADMIN'] } };
    const blockedFilter = isConnected
      ? {
          $or: [
            { isActive: false },
            { isBlocked: true },
            { status: { $regex: /^blocked$/i } },
          ],
        }
      : { isActive: false };

    if (params.role && String(params.role).toLowerCase() !== 'all') {
      const normalizedRole = String(params.role).trim().toLowerCase();
      if (normalizedRole === 'customer' || normalizedRole === 'user') {
        if (isConnected) {
          andClauses.push(customerRoleFilter);
        } else {
          filter.role = { $in: [ROLES.USER, 'customer'] };
        }
      } else if (normalizedRole === 'admin') {
        if (isConnected) {
          andClauses.push(adminRoleFilter);
        } else {
          filter.role = { $in: [...ADMIN_ROLES, 'ADMIN', 'SUPER_ADMIN'] };
        }
      } else if (normalizedRole === 'vendor') {
        if (isConnected) {
          andClauses.push(vendorRoleFilter);
        } else {
          filter.role = ROLES.VENDOR;
        }
      } else {
        filter.role = isConnected ? new RegExp(`^${normalizedRole}$`, 'i') : normalizedRole;
      }
    }

    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      const searchClauses = [
        { fullName: regex },
        { name: regex },
        { email: regex },
        { username: regex },
        { phone: regex },
      ];
      if (isConnected) {
        andClauses.push({ $or: searchClauses });
      } else {
        filter.$or = searchClauses;
      }
    }

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalizedStatus = String(params.status).trim().toLowerCase();
      if (['blocked', 'inactive', 'suspended'].includes(normalizedStatus)) {
        if (isConnected) {
          andClauses.push(blockedFilter);
        } else {
          filter.isActive = false;
        }
      } else if (normalizedStatus === 'active') {
        if (isConnected) {
          andClauses.push({
            isActive: { $ne: false },
            isBlocked: { $ne: true },
            status: { $not: /^blocked$/i },
          });
        } else {
          filter.isActive = { $ne: false };
        }
      }
    } else if (params.isActive !== undefined && params.isActive !== '') {
      filter.isActive = String(params.isActive) === 'true' || params.isActive === true;
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const [
      users,
      total,
      totalAllUsers,
      customersCount,
      vendorsCount,
      adminsCount,
      blockedCount,
    ] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
      User.countDocuments(),
      User.countDocuments(customerRoleFilter),
      User.countDocuments(vendorRoleFilter),
      User.countDocuments(adminRoleFilter),
      User.countDocuments(blockedFilter),
    ]);

    return {
      users: users.map(formatAdminUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalUsers: totalAllUsers,
        customersCount,
        vendorsCount,
        adminsCount,
        blockedCount,
        activeCount: Math.max(0, totalAllUsers - blockedCount),
      },
    };
  }

  async getUserById(userId) {
    ensureValidObjectId(userId, 'user ID');

    const user = await User.findById(userId).populate(
      'vendorId',
      'storeName shopName slug shopSlug status rating email phone logo'
    );
    if (!user) throw ApiError.notFound('User not found');

    const userMatch = { $or: [{ userId: user._id }, { user: user._id }] };
    const isConnected = mongoose.connection.readyState === 1;

    const [
      addresses,
      recentOrdersRaw,
      totalOrders,
      spendAgg,
      ticketCount,
      vendorRequest,
    ] = await Promise.all([
      Address.find(userMatch)
        .sort({ isDefault: -1, createdAt: -1 })
        .lean(),
      Order.find(userMatch)
        .select(
          'orderNumber totalAmount total amount orderStatus status paymentStatus paymentMethod isPaid createdAt orderDate items'
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Order.countDocuments(userMatch),
      Order.aggregate([
        {
          $match: {
            ...userMatch,
            orderStatus: { $nin: NON_SPEND_STATUSES },
            status: { $nin: NON_SPEND_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: {
              $sum: { $ifNull: ['$totalAmount', { $ifNull: ['$total', '$amount'] }] },
            },
          },
        },
      ]),
      SupportTicket.countDocuments(userMatch),
      VendorRequest.findOne({ ...userMatch, isDeleted: { $ne: true } })
        .select('storeName shopName businessName status createdAt')
        .lean(),
    ]);

    let resolvedVendor =
      user.vendorId && typeof user.vendorId === 'object' ? user.vendorId : null;
    if (!resolvedVendor && isConnected) {
      resolvedVendor = await Promise.resolve()
        .then(() =>
          Vendor.findOne(userMatch)
            .select('storeName shopName slug shopSlug status rating email phone logo')
            .lean()
        )
        .catch(() => null);
    }

    const recentOrders = (recentOrdersRaw || []).map((o) => ({
      ...o,
      orderNumber:
        o.orderNumber || (o._id ? `#SS-${String(o._id).slice(-5).toUpperCase()}` : ''),
      totalAmount: o.totalAmount ?? o.total ?? o.amount ?? 0,
      orderStatus: o.orderStatus || o.status || 'pending',
      createdAt: o.createdAt || o.orderDate,
    }));

    const formatted = formatAdminUser(user);
    if (resolvedVendor && (!formatted.vendorId || typeof formatted.vendorId !== 'object')) {
      formatted.vendorId = {
        ...resolvedVendor,
        storeName: resolvedVendor.storeName || resolvedVendor.shopName || '',
        shopName: resolvedVendor.shopName || resolvedVendor.storeName || '',
        slug: resolvedVendor.slug || resolvedVendor.shopSlug || '',
      };
    }

    return {
      ...formatted,
      addresses: addresses || [],
      recentOrders,
      orderStats: {
        totalOrders: Number(totalOrders || 0),
        totalSpent: Number(spendAgg?.[0]?.totalSpent || 0),
      },
      ticketCount: Number(ticketCount || 0),
      vendorRequest: vendorRequest
        ? {
            ...vendorRequest,
            storeName:
              vendorRequest.storeName ||
              vendorRequest.shopName ||
              vendorRequest.businessName ||
              '',
          }
        : null,
    };
  }

  async updateUser(userId, userData = {}, currentAdmin) {
    ensureValidObjectId(userId, 'user ID');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === ROLES.SUPER_ADMIN && currentAdmin?.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can modify a Super Admin account');
    }

    const requestedRole = userData.role
      ? String(userData.role).trim().toLowerCase()
      : undefined;

    if (
      requestedRole === ROLES.SUPER_ADMIN &&
      currentAdmin?.role !== ROLES.SUPER_ADMIN
    ) {
      throw ApiError.forbidden('Only Super Admin can promote a user to Super Admin');
    }

    if (
      userData.fullName !== undefined ||
      userData.name !== undefined
    ) {
      const displayName = String(userData.fullName ?? userData.name ?? '').trim();
      if (!displayName) {
        throw ApiError.badRequest('Name cannot be empty');
      }
      user.fullName = displayName;
      user.name = displayName;
    }

    if (userData.username !== undefined) {
      const cleanUsername = String(userData.username || '').trim().toLowerCase();
      user.username = cleanUsername || undefined;
    }

    if (userData.email !== undefined) {
      const cleanEmail = String(userData.email || '').trim().toLowerCase();
      if (!cleanEmail) throw ApiError.badRequest('Email cannot be empty');
      user.email = cleanEmail;
    }

    if (userData.phone !== undefined) {
      user.phone = String(userData.phone || '').trim();
    }

    if (userData.gender !== undefined) {
      user.gender = String(userData.gender || '').trim();
    }

    if (userData.bio !== undefined) {
      user.bio = String(userData.bio || '').trim();
    }

    if (requestedRole) {
      user.role = requestedRole === 'customer' ? ROLES.USER : requestedRole;
    }

    if (userData.isActive !== undefined) {
      user.isActive = Boolean(userData.isActive);
    }

    try {
      await user.save();
    } catch (err) {
      if (err?.code === 11000) {
        const duplicateField = Object.keys(err.keyPattern || {})[0] || 'Field';
        throw ApiError.conflict(`${duplicateField} is already in use by another account`);
      }
      throw err;
    }

    return this.getUserById(user._id);
  }

  async updateUserStatus(userId, status, currentAdmin) {
    ensureValidObjectId(userId, 'user ID');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === ROLES.SUPER_ADMIN && currentAdmin?.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot modify status of a Super Admin');
    }

    if (
      currentAdmin?._id &&
      String(user._id) === String(currentAdmin._id)
    ) {
      throw ApiError.badRequest('You cannot block or deactivate your own account');
    }

    let nextIsActive;
    if (typeof status === 'boolean') {
      nextIsActive = status;
    } else {
      const normalized = String(status || '').trim().toLowerCase();
      if (['blocked', 'inactive', 'false', 'suspended'].includes(normalized)) {
        nextIsActive = false;
      } else if (['active', 'true', 'unblocked'].includes(normalized)) {
        nextIsActive = true;
      } else {
        throw ApiError.badRequest(`Invalid user status '${status}'`);
      }
    }

    user.isActive = nextIsActive;
    if (mongoose.connection.readyState === 1 && user.set) {
      user.set('isBlocked', !nextIsActive, { strict: false });
      user.set('status', nextIsActive ? 'active' : 'blocked', { strict: false });
    }
    await user.save({ validateModifiedOnly: true });

    return formatAdminUser(user);
  }

  async toggleUserStatus(userId, currentAdmin) {
    ensureValidObjectId(userId, 'user ID');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === ROLES.SUPER_ADMIN && currentAdmin?.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot modify status of a Super Admin');
    }

    if (
      currentAdmin?._id &&
      String(user._id) === String(currentAdmin._id)
    ) {
      throw ApiError.badRequest('You cannot block or deactivate your own account');
    }

    const currentlyBlocked =
      user.isActive === false ||
      user.get?.('isBlocked') === true ||
      user.isBlocked === true ||
      String(user.get?.('status') || user.status || '').toLowerCase() === 'blocked';
    const nextIsActive = currentlyBlocked;
    user.isActive = nextIsActive;
    if (mongoose.connection.readyState === 1 && user.set) {
      user.set('isBlocked', !nextIsActive, { strict: false });
      user.set('status', nextIsActive ? 'active' : 'blocked', { strict: false });
    }
    await user.save({ validateModifiedOnly: true });

    return formatAdminUser(user);
  }

  async deleteUser(userId, currentAdmin) {
    ensureValidObjectId(userId, 'user ID');

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Super Admin accounts cannot be deleted');
    }

    if (
      currentAdmin?._id &&
      String(user._id) === String(currentAdmin._id)
    ) {
      throw ApiError.badRequest('You cannot delete your own account');
    }

    await User.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }
}

export const adminUserService = new AdminUserService();
export default adminUserService;
