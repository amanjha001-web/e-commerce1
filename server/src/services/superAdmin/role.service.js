import { Role } from '../../models/Role.model.js';
import { ApiError } from '../../utils/apiError.js';

export class RoleService {
  async getRoles() {
    return Role.find().populate('permissions');
  }

  async createRole({ name, code, description, permissions = [] }) {
    const existing = await Role.findOne({ code: code.toLowerCase() });
    if (existing) throw ApiError.conflict('Role code already exists');

    return Role.create({
      name,
      code: code.toLowerCase(),
      description,
      permissions,
    });
  }

  async updateRole(roleId, updateData) {
    const role = await Role.findById(roleId);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem) throw ApiError.forbidden('System roles cannot be modified');

    return Role.findByIdAndUpdate(roleId, updateData, { new: true });
  }

  async deleteRole(roleId) {
    const role = await Role.findById(roleId);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem) throw ApiError.forbidden('System roles cannot be deleted');

    await Role.findByIdAndDelete(roleId);
    return { message: 'Role deleted successfully' };
  }
}

export const roleService = new RoleService();
export default roleService;
