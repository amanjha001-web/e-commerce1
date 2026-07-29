const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh-token",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    VERIFY_OTP: "/auth/verify-otp",
  },

  // Products
  PRODUCTS: {
    GET_ALL: "/products",
    GET_BY_ID: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  // Categories
  CATEGORIES: {
    GET_ALL: "/categories",
  },

  // Vendors
  VENDORS: {
    GET_ALL: "/vendors",
    GET_BY_ID: (id) => `/vendors/${id}`,
  },

  // Cart
  CART: {
    GET: "/cart",
    ADD: "/cart",
    UPDATE: (id) => `/cart/${id}`,
    REMOVE: (id) => `/cart/${id}`,
    CLEAR: "/cart/clear",
  },

  // Wishlist
  WISHLIST: {
    GET: "/wishlist",
    ADD: "/wishlist",
    REMOVE: (id) => `/wishlist/${id}`,
  },

  // Orders
  ORDERS: {
    GET_ALL: "/orders",
    GET_BY_ID: (id) => `/orders/${id}`,
    CREATE: "/orders",
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: "/payments/create-order",
    VERIFY: "/payments/verify",
  },
};

export default ENDPOINTS;
