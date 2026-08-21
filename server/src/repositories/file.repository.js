import File from "../models/File.model.js";

/*                         Create File                         */

const createFile = async (fileData) => {
  return await File.create(fileData);
};

/*                      Get File By Id                         */

const getFileById = async (fileId) => {
  return await File.findOne({
    _id: fileId,
    isDeleted: false,
  });
};

/*                      Get User Files                         */

const getUserFiles = async (userId, filters = {}) => {
  const query = {
    uploadedBy: userId,
    isDeleted: false,
  };

  /* ---------------------- Category Filter ---------------------- */

  if (filters.category) {
    query.category = filters.category;
  }

  /* ------------------------ Type Filter ------------------------ */

  if (filters.type) {
    query.type = filters.type;
  }

  return await File.find(query).sort({
    createdAt: -1,
  });
};

/*                         Update File                         */

const updateFile = async (fileId, updateData) => {
  return await File.findOneAndUpdate(
    {
      _id: fileId,
      isDeleted: false,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );
};

/*                         Delete File                         */

const deleteFile = async (fileId) => {
  return await File.findOneAndUpdate(
    {
      _id: fileId,
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    {
      new: true,
    },
  );
};

/*                        Restore File                         */

const restoreFile = async (fileId) => {
  return await File.findOneAndUpdate(
    {
      _id: fileId,
    },
    {
      isDeleted: false,
      deletedAt: null,
      restoredAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

const getDeletedFileById = async (fileId) => {
  return await File.findOne({
    _id: fileId,
    isDeleted: true,
  });
};

/*                           Export                            */

export default {
  createFile,
  getFileById,
  getUserFiles,
  updateFile,
  deleteFile,
  restoreFile,
  getDeletedFileById,
};
