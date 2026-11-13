# ShopSphere — Production Readiness Checklist

Before taking ShopSphere live to real consumers, verify each category in this checklist:

---

## 🔒 1. Security & Authentication
- [x] Passwords hashed using `bcryptjs` with salt rounds >= 10.
- [x] JWT access token expiry set to 15 minutes or less (`JWT_ACCESS_EXPIRES_IN=15m`).
- [x] Refresh token rotation implemented and old tokens invalidated on use.
- [x] Refresh token stored in `httpOnly`, `secure`, `sameSite: lax` cookies.
- [x] Helmet security headers active on all HTTP responses.
- [x] CORS restricted to verified frontend domains (`ALLOWED_ORIGINS`).
- [x] Rate limiting active for auth endpoints (20 attempts per 15 min) and API (1000 requests per 15 min).
- [x] Sensitive fields (`password`, `refreshToken`, `otp`) marked `select: false` in Mongoose schemas.
- [x] Stack traces hidden in production responses (`NODE_ENV=production`).

---

## 💾 2. Database & Data Integrity
- [x] MongoDB URI uses SSL/TLS (`mongodb+srv://...`).
- [x] Database indexes created for frequent lookup fields (`email`, `slug`, `orderNumber`, `status`, `userId`).
- [x] Text search indexes created on `Product` for catalog search.
- [x] Stock deductions executed atomically to prevent overselling or race conditions.
- [x] Database seeding script is idempotent and safe to run multiple times without duplicating data.
- [x] Automated daily MongoDB Atlas backups configured.

---

## 💳 3. Payments & Idempotency
- [x] Razorpay payment signatures verified server-side with HMAC SHA-256 before confirming orders.
- [x] Razorpay webhook endpoint verifies signature against `RAZORPAY_WEBHOOK_SECRET` using raw request body.
- [x] Duplicate webhook events handled idempotently without duplicate order status updates or double earnings credits.
- [x] Prices, shipping, taxes, and coupon discounts strictly calculated on the server without trusting client input.

---

## 📦 4. Integrations & Graceful Degradation
- [x] Cloudinary configured with file type and size limits (5MB images).
- [x] Redis connection failures gracefully fallback to in-memory caching without application downtime.
- [x] Nodemailer transporter configured with secure SMTP credentials.
- [x] Socket.IO authenticated via JWT tokens before allowing room subscriptions.

---

## 📊 5. Monitoring & Operational Readiness
- [x] Centralized Winston logger outputs structured JSON in production.
- [x] Health check endpoint (`/api/v1/health`) reports database connectivity, uptime, and memory usage.
- [x] Process-level handlers for `SIGTERM`, `SIGINT`, `unhandledRejection`, and `uncaughtException` in place.
- [x] All unit and integration test suites passing cleanly (`npm test`).
- [x] Git diff confirmed zero changes in `client/` directory.
