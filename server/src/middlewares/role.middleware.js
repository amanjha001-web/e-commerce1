import ApiError from "../utils/ApiError.js";

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Please login to access this resource"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You are not authorized to access this resource"),
      );
    }

    next();
  };
};

export { authorizeRoles };
