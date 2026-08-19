
/*                              Auth & Users                                  */

export { default as authController } from "./auth.controller.js";
export { default as userController } from "./user.controller.js";
export { default as adminController } from "./admin.controller.js";
export { default as addressController } from "./address.controller.js";

/*                              Vendor                                        */

export { default as vendorController } from "./vendor.controller.js";
export { default as vendorRequestController } from "./vendorRequest.controller.js";

/*                              Catalog                                       */

export { default as productController } from "./product.controller.js";
export { default as productVariantController } from "./productVariant.controller.js";
export { default as categoryController } from "./category.controller.js";
export { default as brandController } from "./brand.controller.js";
export { default as bannerController } from "./banner.controller.js";

/*                              Shopping                                      */

export * from "./cart.controller.js";
export * from "./wishlist.controller.js";
export { default as orderController } from "./order.controller.js";
export { default as paymentController } from "./payment.controller.js";

/*                              Marketing                                     */

export { default as couponController } from "./coupon.controller.js";

/*                              Reviews                                       */

export { default as reviewController } from "./review.controller.js";

/*                              Communication                                 */

export { default as chatController } from "./chat.controller.js";
export { default as conversationController } from "./conversation.controller.js"
export { default as messageController } from "./message.controller.js"
export { default as notificationController } from "./notification.controller.js";

/*                              Files                                         */



/*                              Support                                       */

export { default as supportController } from "./support.controller.js";
export { default as reportController } from "./report.controller.js";

/*                              System                                        */

export { default as settingController } from "./setting.controller.js";
export { default as shipmentController } from "./shipment.controller.js";
export { default as taxController } from "./tax.controller.js";
export { default as searchController } from "./search.controller.js";
