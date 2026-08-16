import { PERMISSIONS } from "../constants/permissions.js";

const ROLE_PERMISSIONS = {
  customer: [PERMISSIONS.PRODUCT_READ],

  vendor: [
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
  ],

  admin: Object.values(PERMISSIONS),
};

const permissionMiddleware = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    const hasPermission = permissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    next();
  };
};

export default permissionMiddleware;
