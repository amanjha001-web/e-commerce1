# ShopSphere — Complete API Documentation

Base Prefix: `/api/v1`

All responses follow a consistent JSON structure:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": []
}
```

---

## 1. Authentication APIs (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new user account |
| `POST` | `/auth/login` | Public | Login with email and password |
| `POST` | `/auth/logout` | Authenticated | Logout current user and clear cookies |
| `POST` | `/auth/refresh-token` | Public (Cookie/Body) | Refresh access token |
| `GET` | `/auth/me` | Authenticated | Get current logged-in user profile |
| `POST` | `/auth/send-verification-otp` | Public | Send 6-digit email OTP |
| `POST` | `/auth/verify-otp` | Public | Verify OTP for email confirmation |
| `POST` | `/auth/verify-email` | Public | Verify email address |
| `POST` | `/auth/forgot-password` | Public | Send password reset email link |
| `POST` | `/auth/reset-password/:token` | Public | Reset password with token |
| `PATCH`| `/auth/change-password` | Authenticated | Change password |
| `POST` | `/auth/google` | Public | Google OAuth 2.0 verification and login |
| `GET` | `/auth/check-username/:username` | Public | Check if username is available |
| `GET` | `/auth/check-email/:email` | Public | Check if email is already registered |

---

## 2. Customer Profile & Addresses (`/api/v1/users`, `/api/v1/addresses`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users/profile` | Customer / Authenticated | Get user profile |
| `PATCH`| `/users/me` | Customer / Authenticated | Update user profile |
| `PATCH`| `/users/avatar` | Customer / Authenticated | Upload new avatar (multipart) |
| `DELETE`| `/users/avatar` | Customer / Authenticated | Remove current avatar |
| `PATCH`| `/users/username` | Customer / Authenticated | Update username |
| `PATCH`| `/users/email` | Customer / Authenticated | Update email |
| `PATCH`| `/users/deactivate` | Customer / Authenticated | Deactivate user account |
| `DELETE`| `/users/account` | Customer / Authenticated | Permanently delete account |
| `GET` | `/addresses` | Customer / Authenticated | List all saved addresses |
| `POST` | `/addresses` | Customer / Authenticated | Add a new address |
| `GET` | `/addresses/default` | Customer / Authenticated | Get default address |
| `GET` | `/addresses/:addressId` | Customer / Authenticated | Get address by ID |
| `PATCH`| `/addresses/:addressId` | Customer / Authenticated | Update an address |
| `DELETE`| `/addresses/:addressId` | Customer / Authenticated | Delete an address |
| `PATCH`| `/addresses/:addressId/default` | Customer / Authenticated | Set as default address |

---

## 3. Product Catalog APIs (`/api/v1/products`, `/api/v1/categories`, `/api/v1/brands`, `/api/v1/banners`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products` | Public | Filtered product listing with pagination |
| `GET` | `/products/:productId` | Public | Product details by ID or Slug |
| `GET` | `/products/search` | Public | Search products by text query |
| `GET` | `/products/flash-sale` | Public | Get flash sale products |
| `GET` | `/products/trending` | Public | Get trending products |
| `GET` | `/products/best-sellers` | Public | Get best seller products |
| `GET` | `/products/new-arrivals` | Public | Get newly arrived products |
| `GET` | `/products/:productId/related` | Public | Get related products in same category |
| `GET` | `/products/recently-viewed` | Authenticated | Get recently viewed products |
| `POST` | `/products/:productId/recently-viewed` | Authenticated | Add product to recently viewed |
| `GET` | `/categories` | Public | List active categories |
| `GET` | `/categories/:categoryId` | Public | Category details |
| `GET` | `/categories/:categoryId/products` | Public | Products under category |
| `GET` | `/brands` | Public | List active brands |
| `GET` | `/brands/:brandId` | Public | Brand details |
| `GET` | `/brands/:brandId/products` | Public | Products by brand |
| `GET` | `/banners/active` | Public | List active promotional banners |
| `PATCH`| `/banners/:bannerId/impression` | Public | Record banner impression |
| `PATCH`| `/banners/:bannerId/click` | Public | Record banner click |

---

## 4. Cart & Wishlist APIs (`/api/v1/cart`, `/api/v1/wishlist`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/cart` | Customer | Get customer's cart with calculated totals |
| `POST` | `/cart` | Customer | Add product to cart |
| `PATCH`| `/cart/:productId` | Customer | Update quantity in cart |
| `DELETE`| `/cart/:productId` | Customer | Remove item from cart |
| `DELETE`| `/cart` | Customer | Clear cart completely |
| `POST` | `/cart/coupon` | Customer | Apply coupon code to cart |
| `DELETE`| `/cart/coupon` | Customer | Remove coupon from cart |
| `GET` | `/cart/validate` | Customer | Validate cart items availability and stock |
| `GET` | `/wishlist` | Customer | Get customer wishlist |
| `POST` | `/wishlist` | Customer | Add product to wishlist |
| `DELETE`| `/wishlist/:productId` | Customer | Remove product from wishlist |
| `DELETE`| `/wishlist` | Customer | Clear wishlist |

---

## 5. Orders & Payments APIs (`/api/v1/orders`, `/api/v1/payments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders` | Customer | Place new order from current cart |
| `GET` | `/orders/my-orders` | Customer | List customer's orders |
| `GET` | `/orders/:orderId` | Customer / Owner | Get order details |
| `PATCH`| `/orders/:orderId/cancel` | Customer / Owner | Cancel pending order |
| `POST` | `/orders/:orderId/return` | Customer / Owner | Request return on delivered order |
| `GET` | `/orders/:orderId/track` | Customer / Owner | Track shipment and status history |
| `POST` | `/payments/create-order` | Customer | Create Razorpay order |
| `POST` | `/payments/verify` | Customer | Verify Razorpay payment signature |
| `GET` | `/payments/:paymentId` | Customer / Owner | Get payment details |
| `GET` | `/payments/order/:orderId` | Customer / Owner | Get payment by order ID |
| `POST` | `/payments/retry` | Customer | Retry payment for an order |
| `POST` | `/payments/:paymentId/refund` | Customer | Request refund on payment |
| `POST` | `/webhooks/razorpay` | Public (Gateway) | Razorpay webhook event handler |

---

## 6. Vendor APIs (`/api/v1/vendor`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/vendor/profile` | Vendor | Get vendor profile |
| `PATCH`| `/vendor/profile` | Vendor | Update vendor profile |
| `GET` | `/vendor/store` | Vendor | Get store details |
| `PATCH`| `/vendor/store` | Vendor | Update store details |
| `PATCH`| `/vendor/store/logo` | Vendor | Update store logo (multipart) |
| `PATCH`| `/vendor/store/banner` | Vendor | Update store banner (multipart) |
| `GET` | `/vendor/store/dashboard` | Vendor | Vendor dashboard statistics |
| `GET` | `/vendor/store/stats` | Vendor | Quick performance metrics |
| `GET` | `/vendor/store/sales` | Vendor | Sales report aggregated |
| `GET` | `/vendor/products` | Vendor | List vendor's own products |
| `POST` | `/vendor/products` | Vendor | Create new product (pending moderation) |
| `PATCH`| `/vendor/products/:productId` | Vendor / Owner | Update own product |
| `DELETE`| `/vendor/products/:productId` | Vendor / Owner | Delete own product |
| `PATCH`| `/vendor/products/:productId/stock`| Vendor / Owner | Update own product stock |
| `POST` | `/vendor/products/:productId/images`| Vendor / Owner | Upload product images |
| `DELETE`| `/vendor/products/:productId/images/:imageId`| Vendor / Owner| Remove product image |
| `GET` | `/vendor/variants/product/:productId`| Vendor / Owner| List product variants |
| `POST` | `/vendor/variants/product/:productId`| Vendor / Owner| Create product variant |
| `PATCH`| `/vendor/variants/:variantId` | Vendor / Owner | Update product variant |
| `DELETE`| `/vendor/variants/:variantId` | Vendor / Owner | Delete product variant |
| `GET` | `/vendor/inventory` | Vendor | List vendor inventory |
| `PATCH`| `/vendor/inventory/:productId` | Vendor / Owner | Direct stock adjustment |
| `GET` | `/vendor/orders` | Vendor | List vendor orders |
| `GET` | `/vendor/orders/:orderId` | Vendor / Owner | Get order details |
| `PATCH`| `/vendor/orders/:orderId/status` | Vendor / Owner | Update order status |
| `GET` | `/vendor/earnings` | Vendor | Vendor earnings & balance |
| `GET` | `/vendor/earnings/summary` | Vendor | Earnings summary |
| `GET` | `/vendor/payouts` | Vendor | Payout history |
| `POST` | `/vendor/payouts` | Vendor | Request new payout |
| `GET` | `/vendor/reviews` | Vendor | Reviews for vendor products |
| `POST` | `/vendor/reviews/:reviewId/reply`| Vendor | Post vendor reply to review |

---

## 7. Admin APIs (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Admin | Dashboard overview & statistics |
| `GET` | `/admin/dashboard/analytics` | Admin | 30-day sales analytics trend |
| `GET` | `/admin/users` | Admin | Manage users list & filters |
| `GET` | `/admin/users/:userId` | Admin | Get user details |
| `PATCH`| `/admin/users/:userId` | Admin | Update user information |
| `PATCH`| `/admin/users/:userId/status`| Admin | Activate / Deactivate user |
| `DELETE`| `/admin/users/:userId` | Admin | Delete user account |
| `GET` | `/admin/vendors` | Admin | Manage vendors |
| `PATCH`| `/admin/vendors/:vendorId/approve`| Admin | Approve vendor |
| `PATCH`| `/admin/vendors/:vendorId/reject` | Admin | Reject vendor |
| `GET` | `/admin/vendor-requests` | Admin | Vendor applications |
| `PATCH`| `/admin/vendor-requests/:requestId/approve`| Admin | Approve application & create store |
| `PATCH`| `/admin/vendor-requests/:requestId/reject` | Admin | Reject application |
| `GET` | `/admin/products` | Admin | Moderate all products |
| `PATCH`| `/admin/products/:productId/approve`| Admin | Approve & publish product |
| `PATCH`| `/admin/products/:productId/reject` | Admin | Reject product |
| `GET` | `/admin/orders` | Admin | Manage all platform orders |
| `PATCH`| `/admin/orders/:orderId/status` | Admin | Admin override order status |
| `POST` | `/admin/orders/:orderId/refund` | Admin | Process order refund |
| `PATCH`| `/admin/orders/:orderId/return/approve`| Admin | Approve customer return |
| `PATCH`| `/admin/orders/:orderId/return/reject` | Admin | Reject customer return |
| `GET` | `/admin/coupons` | Admin | Manage platform coupons |
| `POST` | `/admin/coupons` | Admin | Create coupon |
| `GET` | `/admin/inventory` | Admin | Platform inventory management |
| `PATCH`| `/admin/inventory/:productId/adjust` | Admin | Adjust stock and log movement |
| `GET` | `/admin/reviews` | Admin | Review moderation |
| `PATCH`| `/admin/reviews/:reviewId/approve` | Admin | Approve review |
| `PATCH`| `/admin/reviews/:reviewId/reject`  | Admin | Reject review |
| `GET` | `/admin/vendor-payouts` | Admin | Vendor payout disbursement queue |
| `PATCH`| `/admin/vendor-payouts/:payoutId/status`| Admin | Mark payout as PAID or REJECTED |
| `GET` | `/admin/reports` | Admin | Financial & sales reports |
| `GET` | `/admin/reports/export` | Admin | Export report as CSV |
| `GET` | `/admin/activity-logs` | Admin | Platform audit & activity logs |

---

## 8. Super Admin APIs (`/api/v1/super-admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/super-admin/admins` | Super Admin | Manage administrative accounts |
| `POST` | `/super-admin/admins` | Super Admin | Create Admin / Super Admin |
| `PATCH`| `/super-admin/admins/:adminId` | Super Admin | Update administrative account |
| `DELETE`| `/super-admin/admins/:adminId`| Super Admin | Delete admin account |
| `GET` | `/super-admin/roles` | Super Admin | Manage roles & assign permissions |
| `POST` | `/super-admin/roles` | Super Admin | Create custom role |
| `GET` | `/super-admin/permissions` | Super Admin | List all system permissions |
| `GET` | `/super-admin/settings` | Super Admin | System configuration settings |
| `PATCH`| `/super-admin/settings` | Super Admin | Update system configuration |
| `GET` | `/super-admin/taxes` | Super Admin | Configure GST / tax rules |
| `POST` | `/super-admin/taxes` | Super Admin | Create tax rule |
| `GET` | `/super-admin/shipping` | Super Admin | Configure shipping zones & rates |
| `POST` | `/super-admin/shipping` | Super Admin | Create shipping zone |
| `GET` | `/super-admin/audit-logs` | Super Admin | Global system security audit logs |
