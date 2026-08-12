import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import fileService from "../services/file.service.js";

/*                              Create File                                   */

const createFile = asyncHandler(async (req, res) => {
  const file = await fileService.createFile({
    ...req.body,
    uploadedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, file, "File created successfully."));
});

/*                           Get File By Id                                   */

const getFileById = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await fileService.getFileById(fileId);

  return res.json(new ApiResponse(200, file, "File fetched successfully."));
});

/*                          Get My Files                                     */

const getMyFiles = asyncHandler(async (req, res) => {
  const result = await fileService.getUserFiles(req.user._id, req.query);

  return res.json(
    new ApiResponse(200, result, "User files fetched successfully."),
  );
});

/*                             Get All Files                                  */

const getFiles = asyncHandler(async (req, res) => {
  const result = await fileService.getFiles(req.query);

  return res.json(new ApiResponse(200, result, "Files fetched successfully."));
});

/*                             Update File                                    */

const updateFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await fileService.updateFile(fileId, req.body, req.user._id);

  return res.json(new ApiResponse(200, file, "File updated successfully."));
});

/*                              Delete File                                   */

const deleteFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await fileService.deleteFile(fileId, req.user._id);

  return res.json(new ApiResponse(200, file, "File deleted successfully."));
});

/*                              Restore File                                  */

const restoreFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const file = await fileService.restoreFile(fileId, req.user._id);

  return res.json(new ApiResponse(200, file, "File restored successfully."));
});

/*                         Permanent Delete                                   */

const deleteFileForever = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  await fileService.deleteFileForever(fileId);

  return res.json(new ApiResponse(200, null, "File permanently deleted."));
});

export default{
  createFile,
  getFileById,
  getMyFiles,
  getFiles,
  updateFile,
  deleteFile,
  restoreFile,
  deleteFileForever,
};
