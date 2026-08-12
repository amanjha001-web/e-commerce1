import logger from "../utils/logger.js";

/*                         Response Time Middleware                           */

const responseTime = (req, res, next) => {
  const start = process.hrtime.bigint();

  /*                       Override setHeader before response                  */

  const originalEnd = res.end;

  res.end = function (...args) {
    const end = process.hrtime.bigint();

    const time = Number(end - start) / 1_000_000;

    res.setHeader("X-Response-Time", `${time.toFixed(2)} ms`);

    logger.info(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${time.toFixed(
        2,
      )} ms`,
    );

    return originalEnd.apply(this, args);
  };

  next();
};

export default responseTime;
