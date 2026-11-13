import { Permission } from '../../models/Permission.model.js';
import { ApiError } from '../../utils/apiError.js';

export class PermissionService {
  async getPermissions() {
    return Permission.find().sort({ module: 1, name: 1 });
  }

  async createPermission({ name, code, module, description }) {
    const existing = await Permission.findOne({ code: code.toLowerCase() });
    if (existing) throw ApiError.conflict('Permission code already exists');

    return Permission.create({
      name,
      code: code.toLowerCase(),
      module,
      description,
    });
  }
}

export const permissionService = new PermissionService();
export default permissionService;
