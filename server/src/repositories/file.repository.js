import File from "../models/File.model.js";

/*                              Create File                                   */

const createFile = async (fileData, session = null) => {
  const [file] = await File.create([fileData], { session });

  return file;
};

/*                              Find File By Id                               */

const findFileById = async (fileId) => {
  return File.findById(fileId).populate("uploadedBy", "name email avatar");
};

/*                          Find Files By User                                */

const findFilesByUser = async (userId, filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const files = await File.find({
    uploadedBy: userId,
    ...filter,
  })
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await File.countDocuments({
    uploadedBy: userId,
    ...filter,
  });

  return {
    files,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                           Find Files                                      */

const findFiles = async (filter = {}, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = {
      createdAt: -1,
    },
  } = options;

  const skip = (page - 1) * limit;

  const files = await File.find(filter).sort(sort).skip(skip).limit(limit);

  const total = await File.countDocuments(filter);

  return {
    files,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*                              Update File                                   */

const updateFile = async (fileId, updateData, session = null) => {
  return File.findByIdAndUpdate(fileId, updateData, {
    new: true,
    runValidators: true,
    session,
  });
};

/*                           Soft Delete                                     */

const softDeleteFile = async (fileId) => {
  return File.findByIdAndUpdate(
    fileId,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                              Restore File                                  */

const restoreFile = async (fileId) => {
  return File.findByIdAndUpdate(
    fileId,
    {
      isDeleted: false,
      deletedAt: null,
      restoredAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                              Delete Forever                                */

const deleteFileForever = async (fileId) => {
  return File.findByIdAndDelete(fileId);
};

/*                            Count Files                                     */

const countFiles = async (filter = {}) => {
  return File.countDocuments(filter);
};

export default {
  createFile,
  findFileById,
  findFilesByUser,
  findFiles,
  updateFile,
  softDeleteFile,
  restoreFile,
  deleteFileForever,
  countFiles,
};
