
/*                              User                                          */

export { default as userRepository } from "./user.repository.js";

/*                              Admin                                         */

export { default as adminRepository } from "./admin.repository.js";

/*                              Vendor                                        */

export { default as vendorRepository } from "./vendor.repository.js";

export { default as vendorRequestRepository } from "./vendorRequest.repository.js";

/*                              Product                                       */

export { default as productRepository } from "./product.repository.js";

export { default as productVariantRepository } from "./productVariant.repository.js";

export { default as categoryRepository } from "./category.repository.js";

export { default as brandRepository } from "./brand.repository.js";

/*                              Shopping                                      */

export { default as cartRepository } from "./cart.repository.js";

export { default as wishlistRepository } from "./wishlist.repository.js";

export { default as orderRepository } from "./order.repository.js";

export { default as paymentRepository } from "./payment.repository.js";

/*                              Marketing                                     */

export { default as couponRepository } from "./coupon.repository.js";

export { default as bannerRepository } from "./banner.repository.js";

export { default as taxRepository } from "./tax.repository.js";

/*                              Reviews                                       */

export { default as reviewRepository } from "./review.repository.js";

/*                              Communication                                 */

export { default as chatRepository } from "./chat.repository.js";

export { createNotification, getMyNotifications, getNotificationById, markAsRead, markAllAsRead, getUnreadCount, deleteNotification, clearAllNotifications  } from "./notification.repository.js";

/*                              Support                                       */

export { default as supportRepository } from "./support.repository.js";

export { default as reportRepository } from "./report.repository.js";

/*                              File                                          */

export { default as fileRepository } from "./file.repository.js";

/*                              Search & Setting                              */

export { default as searchRepository } from "./search.repository.js";

export { default as settingRepository } from "./setting.repository.js";

/*                              Shipping                                      */

export { default as shipmentRepository } from "./shipment.repository.js";

/*                              Address                                       */

export { default as addressRepository } from "./address.repository.js";

/*                              Commission                                    */

export { default as commissionRepository } from "./commission.repository.js";
