import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Handle multipart/form-data values
      if (req.is("multipart/form-data")) {
        Object.keys(req.body).forEach((key) => {
          const value = req.body[key];

          if (value === "true") {
            req.body[key] = true;
          } else if (value === "false") {
            req.body[key] = false;
          }
        });
      }

      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new ApiError(400, error.issues?.[0]?.message || "Validation failed"),
        );
      }

      return next(error);
    }
  };
};

export { validate };
