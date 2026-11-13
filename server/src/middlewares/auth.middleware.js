import { verifyAccessToken } from '../utils/token.utils.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.model.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    // 2. Check cookies
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication token required. Please log in.');
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id || decoded._id).populate('vendorId');

    if (!user) {
      throw ApiError.unauthorized('User associated with token no longer exists.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired. Please refresh your token.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }
});

// Optional authenticate for public routes that can personalize data if token present
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id || decoded._id).populate('vendorId');
      if (user && user.isActive) {
        req.user = user;
      }
    } catch {
      // Ignore token failure on optional auth
    }
  }
  next();
});

export default { authenticate, optionalAuthenticate };
