import { createClient } from "redis";

//       REDIS CLIENT CONFIGURATION

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

//       REDIS EVENT LISTENERS

redisClient.on("connect", () => {
  console.log("Connecting to Redis...");
});

//       REDIS EVENT LISTENERS
redisClient.on("ready", () => {
  console.log(" Redis Connected Successfully");
});

//       REDIS ERROR HANDLING
redisClient.on("error", (error) => {
  console.error("Redis Error:", error.message);
});

//       REDIS CONNECTION CLOSED
redisClient.on("end", () => {
  console.log("Redis Connection Closed");
});

// CONNECT REDIS FUNCTION

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error("Failed to connect Redis");
    console.error(error.message);
  }
};

export default redisClient;
