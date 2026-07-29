import upload from "../config/multer.js";

/*
|--------------------------------------------------------------------------
| Single File Uploads
|--------------------------------------------------------------------------
*/

// Product Thumbnail
export const uploadSingle = upload.single("thumbnail");

// Category Image
export const uploadCategoryImage = upload.fields([
  {
    name: "image",
    maxCount: 1,
  },
]);

// Brand Image
export const uploadBrandImage = upload.fields([
  {
    name: "image",
    maxCount: 1,
  },
]);

// User Avatar
export const uploadUserAvatar = upload.fields([
  {
    name: "avatar",
    maxCount: 1,
  },
]);

/*
|--------------------------------------------------------------------------
| Multiple File Uploads
|--------------------------------------------------------------------------
*/

// Product Gallery Images
export const uploadMultiple = upload.array("images", 10);

/*
|--------------------------------------------------------------------------
| Product Upload
|--------------------------------------------------------------------------
*/

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
