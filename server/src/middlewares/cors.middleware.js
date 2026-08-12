import cors from "cors";

/*                              Allowed Origins                               */

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

/*                              CORS Middleware                               */

const corsMiddleware = cors({
  origin(origin, callback) {
    // Postman / Mobile Apps / Server-to-Server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS policy does not allow this origin."));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Origin",
    "Accept",
    "X-Requested-With",
  ],

  exposedHeaders: ["Content-Length", "Content-Type"],

  optionsSuccessStatus: 204,
});

export default corsMiddleware;
