import ApiError from "../utils/ApiError.js";

const authorizeRoles = (...roles) => {
  const normalizedRoles = roles.map((r) => String(r).toLowerCase());
  if (normalizedRoles.includes("admin") && !normalizedRoles.includes("super_admin")) {
    normalizedRoles.push("super_admin");
  }

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Please login to access this resource"));
    }

    const userRole = String(req.user.role || "").toLowerCase();

    if (!normalizedRoles.includes(userRole)) {
      return next(
        new ApiError(403, "You are not authorized to access this resource"),
      );
    }

    next();
  };
};

export { authorizeRoles };
