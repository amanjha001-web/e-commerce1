import mongoose from "mongoose";

import fileRepository from "../repositories/file.repository.js";

import ApiError from "../utils/ApiError.js";


/*                              Create File                                   */


const createFile = async (fileData) => {
  if (!mongoose.Types.ObjectId.isValid(fileData.uploadedBy)) {
    throw new ApiError(400, "Invalid uploaded user id.");
  }

  return fileRepository.createFile(fileData);
};


/*                           Get File By Id                                   */


const getFileById = async (fileId) => {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file id.");
  }

  const file = await fileRepository.findFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File not found.");
  }

  if (file.isDeleted) {
    throw new ApiError(410, "File has been deleted.");
  }

  return file;
};


/*                          Get User Files                                    */


const getUserFiles = async (userId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }

  return fileRepository.findFilesByUser(
    userId,
    {
      isDeleted: false,
    },
    query,
  );
};


/*                             Get Files                                      */


const getFiles = async (query = {}) => {
  return fileRepository.findFiles(
    {
      isDeleted: false,
    },
    query,
  );
};


/*                             Update File                                    */


const updateFile = async (fileId, updateData, userId) => {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file id.");
  }

  const file = await fileRepository.findFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File not found.");
  }

  if (file.uploadedBy._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to update this file.");
  }

  return fileRepository.updateFile(fileId, updateData);
};


/*                            Delete File                                     */


const deleteFile = async (fileId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file id.");
  }

  const file = await fileRepository.findFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File not found.");
  }

  if (file.uploadedBy._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You cannot delete this file.");
  }

  return fileRepository.softDeleteFile(fileId);
};


/*                           Restore File                                     */


const restoreFile = async (fileId, userId) => {
  const file = await fileRepository.findFileById(fileId);

  if (!file) {
    throw new ApiError(404, "File not found.");
  }

  if (file.uploadedBy._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You cannot restore this file.");
  }

  return fileRepository.restoreFile(fileId);
};


/*                        Delete Permanently                                  */


const deleteFileForever = async (fileId) => {
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, "Invalid file id.");
  }

  return fileRepository.deleteFileForever(fileId);
};

export default {
  createFile,
  getFileById,
  getUserFiles,
  getFiles,
  updateFile,
  deleteFile,
  restoreFile,
  deleteFileForever,
};
