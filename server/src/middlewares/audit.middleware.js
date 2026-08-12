import logger from "../utils/logger.js";

/*                             Audit Middleware                               */

const audit =
  (action = "ACTION") =>
  (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        logger.info({
          action,

          method: req.method,

          url: req.originalUrl,

          statusCode: res.statusCode,

          userId: req.user?._id || null,

          role: req.user?.role || "guest",

          ip:
            req.ip ||
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress,

          userAgent: req.headers["user-agent"],

          time: new Date().toISOString(),
        });
      }
    });

    next();
  };

export default audit;
