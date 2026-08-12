/**
 * User Status Constants
 *
 * Used for:
 *  User account lifecycle
 *  Authentication checks
 *  Account restrictions
 *  Security management
 */

export const USER_STATUS = Object.freeze({
  /* Account Creation                                                         */

  PENDING: "pending",

  PENDING_VERIFICATION: "pending_verification",

  /* Active States                                                            */

  ACTIVE: "active",

  /* Restriction States                                                       */

  INACTIVE: "inactive",

  SUSPENDED: "suspended",

  BLOCKED: "blocked",

  /* Security States                                                          */

  LOCKED: "locked",

  /* Account Removal                                                          */

  DEACTIVATED: "deactivated",

  DELETED: "deleted",
});
