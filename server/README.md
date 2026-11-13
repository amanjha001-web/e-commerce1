# ShopSphere — Production-Ready E-Commerce Modular Monolith Backend

ShopSphere is an enterprise-grade multi-vendor e-commerce backend built with **Node.js**, **Express.js**, **MongoDB**, and **JavaScript ES Modules (ESM)** following a clean **Modular Monolith** architecture.

---

## 🛠️ Technology Stack

- **Runtime & Framework:** Node.js (>=18.x / 20.x LTS), Express.js (v4.21.x)
- **Database:** MongoDB with Mongoose ODM (v8.9.x)
- **Architecture:** Modular Monolith (Clean separation: Routes -> Middlewares -> Controllers -> Services -> Repositories -> Models)
- **Security:** Helmet, CORS, bcryptjs, JSON Web Tokens (Access + Refresh Token rotation), Rate Limiting, HTTP-only signed cookies
- **Integrations:** Razorpay (Payments, Refunds, Webhooks), Cloudinary (Media storage), Nodemailer (Transactional email / OTP), Google OAuth 2.0, Socket.IO (Real-time chat & notifications), Redis / Memory fallback caching
- **Validation:** Zod schemas
- **Testing:** Vitest, Supertest

---

## 📂 Directory Structure

```
server/
├── src/
│   ├── app.js                      # Express application configuration & middleware
│   ├── index.js                    # HTTP server entrypoint & graceful shutdown
│   ├── config/                     # Environment, DB, Redis, Cloudinary, Razorpay, Mail, Logger, Socket
│   ├── constants/                  # Roles, Permissions, Order/Payment/Product/Vendor/Refund statuses
│   ├── database/                   # DB Connection, Compound Indexes, Seeders
│   ├── models/                     # 34 Mongoose Models with schema validation & relationships
│   ├── routes/                     # Modular Monolith routes (common, customer, vendor, admin, superAdmin)
│   ├── controllers/                # Request handlers mapping to services
│   ├── services/                   # Core business logic layer
│   ├── repositories/               # Data access layer extending BaseRepository
│   ├── middlewares/                # Auth, Role, RBAC, Ownership, Validation, Multer, Error handling
│   ├── validators/                 # Zod validation schemas
│   ├── integrations/               # Razorpay, Cloudinary, Nodemailer, Google OAuth
│   ├── jobs/                       # Abandoned cart, Expired order cleanup, Payout processing
│   ├── events/                     # Domain EventEmitter listeners
│   └── utils/                      # ApiResponse, ApiError, AsyncHandler, Crypto, Token, Helpers
├── scripts/
│   ├── seed.js                     # Safe database seeding script
│   └── check.js                    # Sanity and import integrity verification
├── tests/                          # Automated unit and integration test suites
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/                           # Architecture, API, Database, Hindi, and Deployment guides
├── .env.example                    # Sample environment variables
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Installation

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure configuration keys (`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, etc.) are configured.

### 3. Database Seeding

Seed default roles, permissions, system settings, sample categories, brands, and an initial Super Admin account:

```bash
npm run seed
```

### 4. Running Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000/api/v1`.

### 5. Running Tests

```bash
# Run all unit & integration tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

---

## 🛡️ Role-Based Access Control (RBAC)

ShopSphere enforces 4 strict distinct roles:

1. **`super_admin`**: Full system control, admin account creation, custom roles, permissions, system settings, tax and shipping configuration, global audit logs.
2. **`admin`**: Dashboard analytics, vendor review/approval, product moderation, global order management, payments/refunds, inventory adjustments, coupons, reviews moderation, banners, support tickets, reports.
3. **`vendor`**: Dedicated store profile, own product CRUD & image uploads, variant management, inventory tracking, store orders fulfillment, earnings & payout requests, review replies.
4. **`user` (Customer)**: Profile & addresses, cart management, wishlist, checkout & order placement, Razorpay payments, returns/refund requests, product reviews, support tickets, real-time chat with vendors.

---

## 💳 Payment & Webhooks

- Razorpay order creation and signature verification are handled strictly on the backend using HMAC SHA-256.
- Webhooks verify raw request bodies to prevent spoofing.
- Duplicate webhook payloads and payment retry attempts are handled idempotently.

---

## 📚 Documentation Index

- [Hindi Architecture Guide (Hinglish)](docs/BACKEND_STRUCTURE_DOCUMENTATION_HI.md)
- [Complete API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema & Relationships Documentation](docs/DATABASE_DOCUMENTATION.md)
- [Production Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Production Readiness Checklist](docs/PRODUCTION_CHECKLIST.md)
