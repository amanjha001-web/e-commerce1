import redisClient from "../config/redis.js";

/*                               Cache Middleware                             */

const cache = (keyPrefix, ttl = 300) => {
  return async (req, res, next) => {
    try {
      if (!redisClient?.isReady) {
        return next();
      }

      const cacheKey = `${keyPrefix}:${req.originalUrl}`;

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }

      const originalJson = res.json.bind(res);

      res.json = async (body) => {
        try {
          if (redisClient.isReady) {
            await redisClient.setEx(cacheKey, ttl, JSON.stringify(body));
          }
        } catch (error) {
          console.error("Redis Cache Error:", error.message);
        }

        return originalJson(body);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

export default cache;
