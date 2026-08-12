import { z } from "zod";

import { objectId } from "./common.validator.js";

/*                              Common ID                                     */

export const idParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

/*                              User ID                                       */

export const userIdParamSchema = z.object({
  params: z.object({
    userId: objectId,
  }),
});

/*                             Product ID                                     */

export const productIdParamSchema = z.object({
  params: z.object({
    productId: objectId,
  }),
});

/*                             Category ID                                    */

export const categoryIdParamSchema = z.object({
  params: z.object({
    categoryId: objectId,
  }),
});

/*                               Brand ID                                     */

export const brandIdParamSchema = z.object({
  params: z.object({
    brandId: objectId,
  }),
});

/*                               Vendor ID                                    */

export const vendorIdParamSchema = z.object({
  params: z.object({
    vendorId: objectId,
  }),
});

/*                               Review ID                                    */

export const reviewIdParamSchema = z.object({
  params: z.object({
    reviewId: objectId,
  }),
});

/*                                Order ID                                    */

export const orderIdParamSchema = z.object({
  params: z.object({
    orderId: objectId,
  }),
});

/*                               Coupon ID                                    */

export const couponIdParamSchema = z.object({
  params: z.object({
    couponId: objectId,
  }),
});

/*                               Address ID                                   */

export const addressIdParamSchema = z.object({
  params: z.object({
    addressId: objectId,
  }),
});

/*                               Wishlist ID                                  */

export const wishlistIdParamSchema = z.object({
  params: z.object({
    wishlistId: objectId,
  }),
});

/*                                Cart ID                                     */

export const cartIdParamSchema = z.object({
  params: z.object({
    cartId: objectId,
  }),
});
