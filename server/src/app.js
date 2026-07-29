import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import brandRoutes from "./routes/brand.routes.js";

import ApiError from "./utils/ApiError.js";
import globalErrorHandler from "./middlewares/error.middleware.js";

const app = express();

/* -------------------------------------------------------------------------- */
/*                               Global Middlewares                           */
/* -------------------------------------------------------------------------- */

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "20kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  }),
);

app.use(cookieParser());

app.use(express.static("public"));

/* -------------------------------------------------------------------------- */
/*                                   Health                                   */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚀 ShopSphere API is Running...",
  });
});

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/categories", categoryRoutes);

app.use("/api/v1/products", productRoutes);

app.use("/api/v1/brands", brandRoutes);

/* -------------------------------------------------------------------------- */
/*                               404 Middleware                               */
/* -------------------------------------------------------------------------- */

app.use((req, res, next) => {
  next(new ApiError(404, `Route Not Found - ${req.originalUrl}`));
});

/* -------------------------------------------------------------------------- */
/*                            Global Error Handler                            */
/* -------------------------------------------------------------------------- */

app.use(globalErrorHandler);

export default app;
