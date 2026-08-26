const ROUTES = {
  HOME: "/",

  AUTH: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    VERIFY_EMAIL: "/verify-email",
    VERIFY_OTP: "/verify-otp",
  },

  CUSTOMER: {
    HOME: "/",
    PRODUCTS: "/products",
    PRODUCT_DETAILS: "/products/:id",
    CATEGORIES: "/categories",
    CART: "/cart",
    WISHLIST: "/wishlist",
    CHECKOUT: "/checkout",

    PROFILE: "/profile",
    ADDRESSES: "/addresses",

    ORDERS: "/orders",
    ORDER_DETAILS: "/orders/:id",

    REVIEWS: "/reviews",
    NOTIFICATIONS: "/notifications",
    CHAT: "/chat",
    SUPPORT: "/support",
  },

  VENDOR: {
    DASHBOARD: "/vendor/dashboard",
    PRODUCTS: "/vendor/products",
    ADD_PRODUCT: "/vendor/products/add",
    EDIT_PRODUCT: "/vendor/products/edit/:id",

    INVENTORY: "/vendor/inventory",

    ORDERS: "/vendor/orders",
    ORDER_DETAILS: "/vendor/orders/:id",

    EARNINGS: "/vendor/earnings",
    PAYOUTS: "/vendor/payouts",

    COUPONS: "/vendor/coupons",
    REVIEWS: "/vendor/reviews",

    PROFILE: "/vendor/profile",
    STORE_SETTINGS: "/vendor/store-settings",
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",

    USERS: "/admin/users",
    USER_DETAILS: "/admin/users/:id",

    VENDORS: "/admin/vendors",
    VENDOR_REQUESTS: "/admin/vendor-requests",

    PRODUCTS: "/admin/products",
    CATEGORIES: "/admin/categories",
    BRANDS: "/admin/brands",
    BANNERS: "/admin/banners",

    ORDERS: "/admin/orders",
    PAYMENTS: "/admin/payments",

    COUPONS: "/admin/coupons",

    REPORTS: "/admin/reports",
    SUPPORT: "/admin/support",
    NOTIFICATIONS: "/admin/notifications",

    PERMISSIONS: "/admin/permissions",
    SETTINGS: "/admin/settings",
  },

  ERROR: {
    NOT_FOUND: "*",
    UNAUTHORIZED: "/unauthorized",
    SERVER_ERROR: "/server-error",
  },
};

export default ROUTES;
