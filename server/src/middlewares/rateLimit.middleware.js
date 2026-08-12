import rateLimit from "express-rate-limit";

/*                             Global API Limiter                             */

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes

  max: 300,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/*                              Auth Limiter                                  */

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 10,

  standardHeaders: true,

  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

/*                             Payment Limiter                                */

export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many payment requests.",
  },
});

/*                             Upload Limiter                                 */

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 50,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Upload limit exceeded.",
  },
});
