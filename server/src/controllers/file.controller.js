import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import fileService from "../services/file.service.js";

/*                         Upload File                         */

const uploadFile = asyncHandler(async (req, res) => {
  const file = await fileService.uploadFile(req.user._id, req.file, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, file, "File uploaded successfully"));
});

/*                       Get My Files                         */

const getFiles = asyncHandler(async (req, res) => {
  const files = await fileService.getFiles(req.user._id, {
    category: req.query.category,
    type: req.query.type,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, files, "Files fetched successfully"));
});

/*                       Update File                         */

const updateFile = asyncHandler(async (req, res) => {
  const file = await fileService.updateFile(
    req.user._id,
    req.params.id,
    req.body,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, file, "File updated successfully"));
});

/*                       Delete File                         */

const deleteFile = asyncHandler(async (req, res) => {
  const result = await fileService.deleteFile(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "File deleted successfully"));
});

/*                      Restore File                         */

const restoreFile = asyncHandler(async (req, res) => {
  const file = await fileService.restoreFile(req.user._id, req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, file, "File restored successfully"));
});

/*                           Export                           */

export default {
  uploadFile,
  getFiles,
  updateFile,
  deleteFile,
  restoreFile,
};
