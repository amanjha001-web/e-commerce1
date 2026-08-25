import fs from "fs";
import cloudinary from "../config/cloudinary.js";

//Upload On Cloudinary
const uploadOnCloudinary = async (
  localFilePath,
  folder = "public/temp",
) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder,
    });

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    throw error;
  }
};

//Delete From Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;

    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw error;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
