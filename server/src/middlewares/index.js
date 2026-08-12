
/*                              Authentication                                */

export { verifyJWT as authMiddleware } from "./verifyJWT.middleware.js";

export { default as optionalAuthMiddleware } from "./optionalAuth.middleware.js";

export { authorizeRoles } from "./role.middleware.js";

export { default as permissionMiddleware } from "./permission.middleware.js";

export { rbacMiddleware as authorize } from "./rbac.middleware.js";

/*                              Security                                      */

export {
  helmetMiddleware,
  mongoSanitizeMiddleware,
  xssMiddleware,
  hppMiddleware,
} from "./security.middleware.js";

export { default as corsMiddleware } from "./cors.middleware.js";

export {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
} from "./rateLimit.middleware.js";

/*                              Request                                       */

export { default as requestIdMiddleware } from "./requestId.middleware.js";

export { requestLogger } from "./requestLogger.middleware.js";

export { default as responseTimeMiddleware } from "./responseTime.middleware.js";

export { default as timeoutMiddleware } from "./timeout.middleware.js";

/*                              Validation                                    */

export { validate} from "./validate.middleware.js";

export { default as idValidationMiddleware } from "./idValidation.middleware.js";



/*                              File                                          */

export {
  uploadSingle,
  uploadMultiple,
  uploadProductImages,
  uploadCategoryImage,
  uploadBrandImage,
  uploadVendorFiles,
  uploadVendorLogo,
  uploadVendorBanner,
  uploadAvatar,
  uploadCoverImage,
  uploadVendorDocuments,
} from "./upload.middleware.js";

export { default as fileCleanupMiddleware } from "./fileCleanup.middleware.js";

/*                              Cache                                         */

export { default as cacheMiddleware } from "./cache.middleware.js";

/*                              Ownership & Audit                             */

export { default as ownershipMiddleware } from "./ownership.middleware.js";

export { default as auditMiddleware } from "./audit.middleware.js";

/*                              Compression                                   */

export { compressMiddleware as compressionMiddleware } from "./compress.middleware.js";

/*                              Error Handling                                */

export { globalErrorHandler } from "./error.middleware.js";

export { notFound } from "./notFound.middleware.js";
