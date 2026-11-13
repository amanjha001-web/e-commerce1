# ShopSphere — Production Deployment Guide

This guide covers step-by-step production deployment for the ShopSphere backend on **Render**, **Railway**, or any standard Node.js cloud hosting provider, with **MongoDB Atlas**, **Upstash Redis**, **Razorpay**, and **Cloudinary**.

---

## 1. Prerequisites

- A GitHub repository containing the ShopSphere project.
- MongoDB Atlas cluster connection string (`mongodb+srv://...`).
- Cloudinary account with Cloud Name, API Key, and API Secret.
- Razorpay live/test account with Key ID, Key Secret, and Webhook Secret.
- SMTP credentials (Gmail App Password, SendGrid, or AWS SES).

---

## 2. Environment Variables Checklist

Configure these environment variables in your hosting provider's dashboard:

```env
NODE_ENV=production
PORT=10000
API_PREFIX=/api/v1
APP_NAME=ShopSphere

# URLs
CLIENT_URL=https://your-shopsphere-client.onrender.com
FRONTEND_URL=https://your-shopsphere-client.onrender.com
ALLOWED_ORIGINS=https://your-shopsphere-client.onrender.com

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopsphere?retryWrites=true&w=majority
MONGODB_DB_NAME=shopsphere

# Redis (e.g. Upstash Redis)
REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379
REDIS_ENABLED=true

# JWT Secrets (Generate random 64-character strings)
JWT_ACCESS_SECRET=your_production_random_64_char_access_secret_key
JWT_REFRESH_SECRET=your_production_random_64_char_refresh_secret_key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=your_production_random_32_char_cookie_signing_secret

# Razorpay Gateway
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_set_in_dashboard

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMTP Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM="ShopSphere <orders@yourdomain.com>"

# Initial Super Admin (For initial seeding only)
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_ADMIN_PASSWORD=SuperStrongInitialPassword2026!
INITIAL_ADMIN_NAME="System Administrator"
```

---

## 3. Deployment on Render

### Step 1: Create a New Web Service
1. In Render dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name:** `shopsphere-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free / Starter / Standard

### Step 2: Add Environment Variables
1. Go to the **Environment** tab in Render.
2. Enter all variables from Section 2.
3. Save changes. Render will automatically build and deploy.

### Step 3: Run Database Seed Script
To initialize default roles, permissions, categories, and the Super Admin account:
1. Open the Render **Shell** tab for the web service.
2. Run:
   ```bash
   npm run seed
   ```

---

## 4. Configuring Razorpay Webhook

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** -> **Webhooks** -> **Add New Webhook**.
3. **Webhook URL:** `https://your-backend-app.onrender.com/api/v1/webhooks/razorpay`
4. **Secret:** Match the `RAZORPAY_WEBHOOK_SECRET` environment variable.
5. **Active Events:**
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
6. Click **Save**.

---

## 5. Health Check & Verification

Once deployed, verify the endpoints:

1. **Root Gateway:**
   ```bash
   curl -I https://your-backend-app.onrender.com/
   # Expected: HTTP/1.1 200 OK
   ```

2. **Health Check:**
   ```bash
   curl https://your-backend-app.onrender.com/api/v1/health
   # Expected: {"success": true, "data": {"status": "OK", "database": {"status": "connected"}}}
   ```
