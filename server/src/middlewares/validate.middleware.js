import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body && req.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query && req.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params && req.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(ApiError.unprocessableEntity('Validation failed', formattedErrors));
      }
      return next(ApiError.badRequest(error.message));
    }
  };
};

export default validate;
