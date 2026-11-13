import { ApiError } from '../utils/apiError.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions.constant.js';
import { ROLES } from '../constants/roles.constant.js';

export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    // Super Admin has all permissions automatically
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[req.user.role] || [];

    const hasAll = requiredPermissions.every((perm) => rolePermissions.includes(perm));

    if (!hasAll) {
      return next(
        ApiError.forbidden(
          `Access denied. Missing required permission(s): ${requiredPermissions.join(', ')}`
        )
      );
    }

    next();
  };
};

export default requirePermission;
