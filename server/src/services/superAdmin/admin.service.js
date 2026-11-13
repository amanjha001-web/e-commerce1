import { User } from '../../models/User.model.js';
import { ApiError } from '../../utils/apiError.js';
import { hashPassword } from '../../utils/crypto.utils.js';
import { sanitizeUser, parsePagination } from '../../utils/helpers.js';
import { ROLES } from '../../constants/roles.constant.js';

export class SuperAdminManagementService {
  async getAdmins(params = {}) {
    const { page, limit, skip, sort } = parsePagination(params);
    const filter = { role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } };

    const [admins, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      admins: admins.map(sanitizeUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createAdmin({ name, email, password, role = ROLES.ADMIN, phone }) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) throw ApiError.conflict('User with this email already exists');

    const hashedPassword = await hashPassword(password);
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === ROLES.SUPER_ADMIN ? ROLES.SUPER_ADMIN : ROLES.ADMIN,
      phone: phone || '',
      isEmailVerified: true,
      isActive: true,
    });

    return sanitizeUser(admin);
  }

  async updateAdmin(adminId, updateData) {
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }
    const admin = await User.findByIdAndUpdate(adminId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!admin) throw ApiError.notFound('Admin not found');
    return sanitizeUser(admin);
  }

  async deleteAdmin(adminId, currentSuperAdminId) {
    if (adminId.toString() === currentSuperAdminId.toString()) {
      throw ApiError.badRequest('You cannot delete your own Super Admin account');
    }
    const admin = await User.findByIdAndDelete(adminId);
    if (!admin) throw ApiError.notFound('Admin not found');
    return { message: 'Admin deleted successfully' };
  }
}

export const superAdminManagementService = new SuperAdminManagementService();
export default superAdminManagementService;
