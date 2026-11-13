import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { parsePagination, sanitizeUser } from '../../utils/helpers.js';
import { ROLES } from '../../constants/roles.constant.js';

export class AdminUserService {
  async getUsers(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = {};

    if (params.role) filter.role = params.role;
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { email: { $regex: params.search, $options: 'i' } },
        { username: { $regex: params.search, $options: 'i' } },
      ];
    }
    if (params.isActive !== undefined) {
      filter.isActive = params.isActive === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      users: users.map(sanitizeUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId) {
    const user = await User.findById(userId).populate('vendorId');
    if (!user) throw ApiError.notFound('User not found');
    return sanitizeUser(user);
  }

  async updateUser(userId, userData, currentAdmin) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Prevent privilege escalation: Regular admin cannot modify super_admin or promote to super_admin
    if (user.role === ROLES.SUPER_ADMIN && currentAdmin.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can modify a Super Admin account');
    }
    if (userData.role === ROLES.SUPER_ADMIN && currentAdmin.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Only Super Admin can promote a user to Super Admin');
    }

    const updated = await User.findByIdAndUpdate(userId, userData, {
      new: true,
      runValidators: true,
    });
    return sanitizeUser(updated);
  }

  async updateUserStatus(userId, status, currentAdmin) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === ROLES.SUPER_ADMIN && currentAdmin.role !== ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Cannot modify status of a Super Admin');
    }

    const isActive = typeof status === 'boolean' ? status : status === 'active' || status === true;
    user.isActive = isActive;
    await user.save();

    return sanitizeUser(user);
  }

  async deleteUser(userId, currentAdmin) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.role === ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('Super Admin accounts cannot be deleted');
    }

    await User.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }
}

export const adminUserService = new AdminUserService();
export default adminUserService;
