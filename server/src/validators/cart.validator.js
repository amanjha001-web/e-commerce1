import { z } from "zod";

import { objectId, positiveInteger } from "./common.validator.js";

/*                               Base Schema                                  */

const quantity = positiveInteger.max(999, "Quantity cannot exceed 999");

/*                              Add To Cart                                   */

export const addToCartSchema = z.object({
  body: z.object({
    productId: objectId,

    quantity,
  }),
});

/*                           Update Cart Item                                 */

export const updateCartItemSchema = z.object({
  params: z.object({
    productId: objectId,
  }),

  body: z.object({
    quantity,
  }),
});

/*                          Remove Cart Item                                  */

export const removeCartItemSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                            Clear Cart                                      */

export const clearCartSchema = z.object({
  body: z.object({}),
});

/*                         Move To Wishlist                                   */

export const moveToWishlistSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                          Buy Now                                           */

export const buyNowSchema = z.object({
  body: z.object({
    productId: objectId,

    quantity,
  }),
});

/*                           Cart Item Params                                 */

export const cartItemIdSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});
