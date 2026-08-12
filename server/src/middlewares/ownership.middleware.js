import ApiError from "../utils/ApiError.js";

/*                           Resource Ownership Check                         */

const checkOwnership = (
  repository,
  resourceIdParam = "id",
  ownerField = "owner",
) => {
  return async (req, res, next) => {
    try {
      /*                               Admin Skip                             */

      if (req.user.role === "admin") {
        return next();
      }

      /*                            Resource Id                               */

      const resourceId = req.params[resourceIdParam];

      const resource = await repository.getById(resourceId);

      if (!resource) {
        return next(new ApiError(404, "Resource not found"));
      }

      /*                         Ownership Validation                         */

      const ownerId = resource[ownerField]?._id || resource[ownerField];

      if (ownerId?.toString() !== req.user._id.toString()) {
        return next(
          new ApiError(403, "You are not allowed to access this resource"),
        );
      }

      req.resource = resource;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default checkOwnership;
