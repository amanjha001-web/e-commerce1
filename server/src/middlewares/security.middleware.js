import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xssClean from "xss-clean";

/*                              Helmet Middleware                             */

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },
});

/*                          Mongo Sanitize Middleware                         */

const mongoSanitizeMiddleware = mongoSanitize();

/*                              XSS Protection                                */

const xssMiddleware = xssClean();

/*                             HTTP Parameter Pollution                       */

const hppMiddleware = hpp({
  whitelist: ["sort", "fields", "category", "brand", "price", "rating"],
});

export {
  helmetMiddleware,
  mongoSanitizeMiddleware,
  xssMiddleware,
  hppMiddleware,
};
