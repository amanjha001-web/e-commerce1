import ApiError from "../utils/ApiError.js";

/*                           Image Validator                                  */

export const validateImage = ({
  field = "image",
  required = false,
  maxSize = 5 * 1024 * 1024, // 5 MB
} = {}) => {
  return (req, res, next) => {
    let file = null;

    if (req.file) {
      file = req.file;
    } else if (req.files?.[field]?.length) {
      file = req.files[field][0];
    }

    if (!file) {
      if (required) {
        return next(new ApiError(400, `${field} is required`));
      }

      return next();
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return next(
        new ApiError(
          400,
          "Only JPG, JPEG, PNG, WEBP and AVIF images are allowed",
        ),
      );
    }

    if (file.size > maxSize) {
      return next(
        new ApiError(
          400,
          `Image size cannot exceed ${maxSize / (1024 * 1024)} MB`,
        ),
      );
    }

    next();
  };
};

/*                        Multiple Images Validator                           */

export const validateImages = ({
  field = "images",
  required = false,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024,
} = {}) => {
  return (req, res, next) => {
    const files = req.files?.[field] || [];

    if (required && files.length === 0) {
      return next(new ApiError(400, `${field} is required`));
    }

    if (files.length > maxFiles) {
      return next(new ApiError(400, `Maximum ${maxFiles} files are allowed`));
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return next(new ApiError(400, "Invalid image format"));
      }

      if (file.size > maxSize) {
        return next(
          new ApiError(
            400,
            `Each image must be smaller than ${maxSize / (1024 * 1024)} MB`,
          ),
        );
      }
    }

    next();
  };
};

/*                           PDF Validator                                    */

export const validatePdf = ({
  field = "document",
  required = false,
  maxSize = 10 * 1024 * 1024,
} = {}) => {
  return (req, res, next) => {
    const file = req.file || req.files?.[field]?.[0];

    if (!file) {
      if (required) {
        return next(new ApiError(400, `${field} is required`));
      }

      return next();
    }

    if (file.mimetype !== "application/pdf") {
      return next(new ApiError(400, "Only PDF files are allowed"));
    }

    if (file.size > maxSize) {
      return next(
        new ApiError(
          400,
          `PDF size cannot exceed ${maxSize / (1024 * 1024)} MB`,
        ),
      );
    }

    next();
  };
};
