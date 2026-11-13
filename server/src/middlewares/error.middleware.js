import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If not instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose CastError (bad ObjectId)
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource ID format for '${err.path}'`);
  }

  // Handle Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`Duplicate value for '${field}'. A resource with that ${field} already exists.`);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid security token.');
  }
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Security token has expired.');
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - ${error.message}`, {
      stack: error.stack,
      body: req.body,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${error.statusCode} ${error.message}`);
  }

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
