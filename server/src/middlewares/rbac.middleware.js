const rbacMiddleware = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((r) => String(r).toLowerCase());
  if (normalizedRoles.includes("admin") && !normalizedRoles.includes("super_admin")) {
    normalizedRoles.push("super_admin");
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const userRole = String(req.user.role || "").toLowerCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource",
      });
    }

    next();
  };
};

export {rbacMiddleware};
