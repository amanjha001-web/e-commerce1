/**
 * Vendor Status Constants
 *
 * Used for:
 *  Vendor onboarding
 *  Admin approval workflow
 *  Vendor account management
 *  Marketplace control
 */

export const VENDOR_STATUS = Object.freeze({
  /* Registration Flow                                                        */

  PENDING: "pending",

  UNDER_REVIEW: "under_review",

  /* Approval States                                                          */

  APPROVED: "approved",

  ACTIVE: "active",

  /* Restriction States                                                       */

  SUSPENDED: "suspended",

  BLOCKED: "blocked",

  BANNED: "banned",

  /* Rejection States                                                         */

  REJECTED: "rejected",

  /* Exit States                                                              */

  DEACTIVATED: "deactivated",
});
