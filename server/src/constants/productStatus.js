/**
 * Product Status Constants
 *
 * Used for:
 *  Product lifecycle management
 *  Vendor product approval flow
 *  Admin moderation
 *  Inventory handling
 */

export const PRODUCT_STATUS = Object.freeze({
  /* Product Creation Flow                                                    */

  DRAFT: "draft",

  PENDING_APPROVAL: "pending_approval",

  /* Active Product States                                                    */

  ACTIVE: "active",

  FEATURED: "featured",

  /* Inventory Related States                                                 */

  OUT_OF_STOCK: "out_of_stock",

  LOW_STOCK: "low_stock",

  /* Moderation States                                                        */

  REJECTED: "rejected",

  BLOCKED: "blocked",

  SUSPENDED: "suspended",

  /* End Of Life States                                                       */

  ARCHIVED: "archived",

  DELETED: "deleted",
});
