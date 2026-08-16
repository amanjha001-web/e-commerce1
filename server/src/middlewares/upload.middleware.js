import { upload } from "../config/index.js";

/*                             Common Uploads                                 */

export const uploadSingle = upload.single("thumbnail");

export const uploadMultiple = upload.array("images", 10);

/*                             Product Upload                                 */

export const uploadProductImages = upload.fields([
  {
    name: "thumbnail",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 10,
  },
]);

/*                             Category Upload                                */

export const uploadCategoryImage = upload.fields([
  {
    name: "image",
    maxCount: 1,
  },
]);

/*                               Brand Upload                                 */

export const uploadBrandImage = upload.fields([
  {
    name: "image",
    maxCount: 1,
  },
]);

/*                               Vendor Upload                                */

export const uploadVendorFiles = upload.fields([
  {
    name: "logo",
    maxCount: 1,
  },
  {
    name: "banner",
    maxCount: 1,
  },
]);

export const uploadVendorLogo = upload.fields([
  {
    name: "logo",
    maxCount: 1,
  },
]);

export const uploadVendorBanner = upload.fields([
  {
    name: "banner",
    maxCount: 1,
  },
]);

export const uploadAvatar = upload.single("avatar");
export const uploadCoverImage = upload.single("coverImage");
export const uploadVendorDocuments = upload.array("documents", 5);

/*                              Banner Upload                                  */

export const uploadBannerImages = upload.fields([
  {
    name: "desktopImage",
    maxCount: 1,
  },
  {
    name: "mobileImage",
    maxCount: 1,
  },
  {
    name: "tabletImage",
    maxCount: 1,
  },
]);