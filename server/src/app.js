import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { helmet as helmetConfig, cors as corsOptions } from "./config/index.js";

import {
  requestLogger,
  globalErrorHandler,
  compressionMiddleware,
  apiLimiter,
  notFound,
} from "./middlewares/index.js";

/*                                  Routes                                    */

import {
  authRoutes,
  userRoutes,
  adminRoutes,
  vendorRoutes,
  vendorRequestRoutes,
  addressRoutes,
  brandRoutes,
  categoryRoutes,
  productRoutes,
  productVariantRoutes,
  cartRoutes,
  wishlistRoutes,
  orderRoutes,
  paymentRoutes,
  couponRoutes,
  bannerRoutes,
  reviewRoutes,
  chatRoutes,
  notificationRoutes,
  fileRoutes,
  searchRoutes,
  reportRoutes,
  supportRoutes,
  settingRoutes,
  shipmentRoutes,
  taxRoutes,
  conversationRoutes,
} from "./routes/index.js";



const app = express();

/*                          Global Middlewares                                */

app.use(helmetConfig);

app.use(cors(corsOptions));

app.use(requestLogger);

app.use(compressionMiddleware);

app.use(
  express.json({
    limit: "20kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  }),
);

app.use(cookieParser());

app.use(express.static("public"));

/*                              Rate Limiting                                 */

app.use("/api", apiLimiter);

/*                              Health Check                                  */

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "OK",
    message: "ShopSphere API is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/*                               API Routes                                   */

// Auth
app.use("/api/v1/auth", authRoutes);

// User
app.use("/api/v1/users", userRoutes);

// Admin
app.use("/api/v1/admin", adminRoutes);

// Vendor
app.use("/api/v1/vendors", vendorRoutes);

app.use("/api/v1/vendor-requests", vendorRequestRoutes);

// Address
app.use("/api/v1/address", addressRoutes);

// Catalog
app.use("/api/v1/brands", brandRoutes);

app.use("/api/v1/categories", categoryRoutes);

app.use("/api/v1/products", productRoutes);

app.use("/api/v1", productVariantRoutes);

// Customer
app.use("/api/v1/cart", cartRoutes);

app.use("/api/v1/wishlist", wishlistRoutes);

// Order & Payment
app.use("/api/v1/orders", orderRoutes);

app.use("/api/v1/payments", paymentRoutes);

// Marketing
app.use("/api/v1/coupons", couponRoutes);

app.use("/api/v1/banners", bannerRoutes);

// Review
app.use("/api/v1/reviews", reviewRoutes);

// Communication
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/conversations", conversationRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Files
app.use("/api/v1/files", fileRoutes);

// Search
app.use("/api/v1/search", searchRoutes);

// Reports & Support
app.use("/api/v1/reports", reportRoutes);

app.use("/api/v1/support", supportRoutes);

// System
app.use("/api/v1/settings", settingRoutes);

app.use("/api/v1/shipments", shipmentRoutes);

app.use("/api/v1/taxes", taxRoutes);

/*                              Error Handling                                */

app.use(notFound);

app.use(globalErrorHandler);

export default app;
