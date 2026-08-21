import ApiError from "../utils/ApiError.js";

import fileRepository from "../repositories/file.repository.js";

import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

/*                         Get File                         */

const getFile = async (userId, fileId) => {
  const file = await fileRepository.getFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File not found");
  }

  if (file.uploadedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to access this file");
  }

  return file;
};

/*                       Upload File                        */

const uploadFile = async (userId, uploadedFile, fileData = {}) => {
  if (!uploadedFile) {
    throw new ApiError(400, "File is required");
  }

  let cloudinaryResponse;

  try {
    /* -------------------- Upload To Cloudinary -------------------- */

    cloudinaryResponse = await uploadOnCloudinary(
      uploadedFile.path,
      fileData.folder || "shopsphere/others",
    );

    if (!cloudinaryResponse) {
      throw new ApiError(500, "File upload to Cloudinary failed");
    }

    /* -------------------- Create Database Record -------------------- */

    const file = await fileRepository.createFile({
      uploadedBy: userId,

      name: uploadedFile.originalname,

      url: cloudinaryResponse.secure_url,

      publicId: cloudinaryResponse.public_id,

      provider: "CLOUDINARY",

      type: "IMAGE",

      category: fileData.category || "OTHER",

      mimeType: uploadedFile.mimetype,

      extension: uploadedFile.originalname.includes(".")
        ? uploadedFile.originalname.split(".").pop().toLowerCase()
        : null,

      size: uploadedFile.size,

      metadata: {
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
      },
    });

    return file;
  } catch (error) {
    /*
     * Cloudinary utility already removes the local
     * temporary file after successful/failed upload.
     */

    throw error;
  }
};

/*                      Get My Files                       */

const getFiles = async (userId, filters = {}) => {
  const files = await fileRepository.getUserFiles(userId, filters);

  return {
    totalFiles: files.length,
    files,
  };
};

/*                       Update File                       */

const updateFile = async (userId, fileId, updateData) => {
  const file = await getFile(userId, fileId);

  const allowedFields = ["name", "category"];

  const updateFields = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  const updatedFile = await fileRepository.updateFile(file._id, updateFields);

  if (!updatedFile) {
    throw new ApiError(404, "File not found");
  }

  return updatedFile;
};


/*                       Delete File                       */

const deleteFile = async (userId, fileId) => {
  const file = await getFile(userId, fileId);

  await fileRepository.deleteFile(file._id);

  return {
    message: "File deleted successfully",
  };
};

/*                      Restore File                       */

/*                      Restore File                       */

const restoreFile = async (userId, fileId) => {
  const file = await fileRepository.getDeletedFileById(fileId);

  if (!file) {
    throw new ApiError(404, "Deleted file not found");
  }

  if (file.uploadedBy.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to restore this file",
    );
  }

  const restoredFile = await fileRepository.restoreFile(file._id);

  if (!restoredFile) {
    throw new ApiError(404, "File could not be restored");
  }

  return restoredFile;
};
/*                          Export                          */

export default {
  uploadFile,
  getFiles,
  updateFile,
  deleteFile,
  restoreFile,
};
