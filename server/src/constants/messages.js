/**
   Application Messages
 
   Used for:
   API responses
   Error handling
   Success messages
   Centralized message management
 */

export const MESSAGES = Object.freeze({
  /* Common Messages                                                          */

  COMMON: Object.freeze({
    SUCCESS: "Operation completed successfully",

    SOMETHING_WENT_WRONG: "Something went wrong",

    INVALID_REQUEST: "Invalid request",

    UNAUTHORIZED: "Unauthorized access",

    FORBIDDEN: "You do not have permission to perform this action",

    NOT_FOUND: "Resource not found",
  }),

  /* Authentication Messages                                                  */

  AUTH: Object.freeze({
    REGISTER_SUCCESS: "User registered successfully",

    LOGIN_SUCCESS: "Login successful",

    LOGOUT_SUCCESS: "Logout successful",

    INVALID_CREDENTIALS: "Invalid email or password",

    USER_NOT_FOUND: "User not found",

    EMAIL_ALREADY_EXISTS: "Email already exists",

    USERNAME_ALREADY_EXISTS: "Username already exists",

    EMAIL_NOT_VERIFIED: "Please verify your email",

    TOKEN_EXPIRED: "Token expired",

    INVALID_TOKEN: "Invalid token",

    PASSWORD_CHANGED: "Password changed successfully",

    PASSWORD_RESET_SUCCESS: "Password reset successfully",
  }),

  /* User Messages                                                            */

  USER: Object.freeze({
    PROFILE_UPDATED: "Profile updated successfully",

    ACCOUNT_BLOCKED: "Account is blocked",

    ACCOUNT_SUSPENDED: "Account is suspended",

    ACCOUNT_DELETED: "Account deleted successfully",
  }),

  /* Vendor Messages                                                          */

  VENDOR: Object.freeze({
    CREATED: "Vendor application submitted successfully",

    APPROVED: "Vendor approved successfully",

    REJECTED: "Vendor rejected successfully",

    SUSPENDED: "Vendor suspended successfully",
  }),

  /* Product Messages                                                         */

  PRODUCT: Object.freeze({
    CREATED: "Product created successfully",

    UPDATED: "Product updated successfully",

    DELETED: "Product deleted successfully",

    NOT_FOUND: "Product not found",

    OUT_OF_STOCK: "Product is out of stock",
  }),

  /* Order Messages                                                           */

  ORDER: Object.freeze({
    CREATED: "Order placed successfully",

    UPDATED: "Order updated successfully",

    CANCELLED: "Order cancelled successfully",

    NOT_FOUND: "Order not found",
  }),

  /* Payment Messages                                                         */

  PAYMENT: Object.freeze({
    SUCCESS: "Payment successful",

    FAILED: "Payment failed",

    REFUND_SUCCESS: "Refund processed successfully",
  }),
});
