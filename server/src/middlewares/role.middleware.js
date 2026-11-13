import { ApiError } from '../utils/apiError.js';
import { ROLES } from '../constants/roles.constant.js';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }

    const userRole = req.user.role;

    // Normalize roles (handle 'user' and 'customer' synonym)
    const allowedRoles = roles.map((r) => (r === 'customer' ? 'user' : r));
    const effectiveUserRole = userRole === 'customer' ? 'user' : userRole;

    if (!allowedRoles.includes(effectiveUserRole)) {
      return next(
        ApiError.forbidden(
          `Forbidden: Role '${userRole}' does not have permission to access this resource.`
        )
      );
    }

    next();
  };
};

export const requireSuperAdmin = authorize(ROLES.SUPER_ADMIN);
export const requireAdmin = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);
export const requireVendor = authorize(ROLES.VENDOR);
export const requireCustomer = authorize(ROLES.USER);

export default { authorize, requireSuperAdmin, requireAdmin, requireVendor, requireCustomer };
