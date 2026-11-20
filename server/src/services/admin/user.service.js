import mongoose from 'mongoose';
import { User } from '../../models/User.model.js';
import { Address } from '../../models/Address.model.js';
import { Order } from '../../models/Order.model.js';
import { SupportTicket } from '../../models/SupportTicket.model.js';
import { VendorRequest } from '../../models/VendorRequest.model.js';
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

  const isActive = clean.isActive !== false;
  return {
    ...clean,
    fullName: clean.fullName || clean.name || '',
    name: clean.name || clean.fullName || '',
    isActive,
    isBlocked: !isActive,
    status: isActive ? 'active' : 'blocked',
    isVerified: Boolean(clean.isEmailVerified),
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

    if (params.role && String(params.role).toLowerCase() !== 'all') {
      const normalizedRole = String(params.role).trim().toLowerCase();
      if (normalizedRole === 'customer' || normalizedRole === 'user') {
        filter.role = { $in: [ROLES.USER, 'customer'] };
      } else if (normalizedRole === 'admin') {
        filter.role = { $in: [...ADMIN_ROLES, 'ADMIN', 'SUPER_ADMIN'] };
      } else {
        filter.role = normalizedRole;
      }
    }

    if (params.search && String(params.search).trim()) {
      const regex = { $regex: String(params.search).trim(), $options: 'i' };
      filter.$or = [
        { fullName: regex },
        { name: regex },
        { email: regex },
        { username: regex },
        { phone: regex },
      ];
    }

    if (params.status && String(params.status).toLowerCase() !== 'all') {
      const normalizedStatus = String(params.status).trim().toLowerCase();
      if (['blocked', 'inactive', 'suspended'].includes(normalizedStatus)) {
        filter.isActive = false;
      } else if (normalizedStatus === 'active') {
        filter.isActive = { $ne: false };
      }
    } else if (params.isActive !== undefined && params.isActive !== '') {
      filter.isActive = String(params.isActive) === 'true' || params.isActive === true;
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
      User.countDocuments({ role: { $in: [ROLES.USER, 'customer'] } }),
      User.countDocuments({ role: ROLES.VENDOR }),
      User.countDocuments({ role: { $in: [...ADMIN_ROLES, 'ADMIN', 'SUPER_ADMIN'] } }),
      User.countDocuments({ isActive: false }),
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
      'storeName slug status rating email phone logo'
    );
    if (!user) throw ApiError.notFound('User not found');

    const [
      addresses,
      recentOrders,
      totalOrders,
      spendAgg,
      ticketCount,
      vendorRequest,
    ] = await Promise.all([
      Address.find({ userId: user._id })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean(),
      Order.find({ userId: user._id })
        .select(
          'orderNumber totalAmount orderStatus paymentStatus paymentMethod isPaid createdAt items'
        )
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Order.countDocuments({ userId: user._id }),
      Order.aggregate([
        {
          $match: {
            userId: user._id,
            orderStatus: { $nin: NON_SPEND_STATUSES },
          },
        },
        { $group: { _id: null, totalSpent: { $sum: '$totalAmount' } } },
      ]),
      SupportTicket.countDocuments({ userId: user._id }),
      VendorRequest.findOne({ userId: user._id, isDeleted: { $ne: true } })
        .select('storeName businessName status createdAt')
        .lean(),
    ]);

    return {
      ...formatAdminUser(user),
      addresses: addresses || [],
      recentOrders: recentOrders || [],
      orderStats: {
        totalOrders: Number(totalOrders || 0),
        totalSpent: Number(spendAgg?.[0]?.totalSpent || 0),
      },
      ticketCount: Number(ticketCount || 0),
      vendorRequest: vendorRequest || null,
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
    await user.save();

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

    user.isActive = user.isActive === false;
    await user.save();

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
