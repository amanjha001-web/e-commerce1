import { z } from "zod";

import { objectId } from "./common.validator.js";

/*                             Add To Wishlist                                */

export const addToWishlistSchema = z.object({
  body: z.object({
    productId: objectId,
  }),
});

/*                          Remove From Wishlist                              */

export const removeFromWishlistSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                            Move To Cart                                    */

export const moveToCartSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                           Wishlist Item                                    */

export const wishlistItemSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                           Clear Wishlist                                   */

export const clearWishlistSchema = z.object({
  body: z.object({}),
});
