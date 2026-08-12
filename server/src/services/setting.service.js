import mongoose from "mongoose";

import settingRepository from "../repositories/setting.repository.js";

import ApiError from "../utils/ApiError.js";

/*                            Create Setting                                  */

const createSetting = async (settingData) => {
  const existingSetting = await settingRepository.findSettingByKey(
    settingData.key,
  );

  if (existingSetting) {
    throw new ApiError(409, "Setting already exists.");
  }

  return settingRepository.createSetting({
    ...settingData,
    key: settingData.key.trim().toUpperCase(),
  });
};

/*                           Get Setting By Id                                */

const getSettingById = async (settingId) => {
  if (!mongoose.Types.ObjectId.isValid(settingId)) {
    throw new ApiError(400, "Invalid setting id.");
  }

  const setting = await settingRepository.findSettingById(settingId);

  if (!setting) {
    throw new ApiError(404, "Setting not found.");
  }

  return setting;
};

/*                           Get Setting By Key                               */

const getSettingByKey = async (key) => {
  const setting = await settingRepository.findSettingByKey(key);

  if (!setting) {
    throw new ApiError(404, "Setting not found.");
  }

  return setting;
};

/*                           Get Public Settings                              */

const getPublicSettings = async () => {
  return settingRepository.findPublicSettings();
};

/*                           Get All Settings                                 */

const getSettings = async (filter = {}, query = {}) => {
  return settingRepository.findSettings(filter, query);
};

/*                            Update Setting                                  */

const updateSetting = async (settingId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(settingId)) {
    throw new ApiError(400, "Invalid setting id.");
  }

  if (updateData.key) {
    const existingSetting = await settingRepository.findSettingByKey(
      updateData.key,
    );

    if (existingSetting && existingSetting._id.toString() !== settingId) {
      throw new ApiError(409, "Setting key already exists.");
    }

    updateData.key = updateData.key.trim().toUpperCase();
  }

  const setting = await settingRepository.updateSetting(settingId, updateData);

  if (!setting) {
    throw new ApiError(404, "Setting not found.");
  }

  return setting;
};

/*                          Update Setting By Key                             */

const updateSettingByKey = async (key, updateData) => {
  const setting = await settingRepository.updateSettingByKey(key, updateData);

  if (!setting) {
    throw new ApiError(404, "Setting not found.");
  }

  return setting;
};

/*                           Delete Setting                                   */

const deleteSetting = async (settingId) => {
  if (!mongoose.Types.ObjectId.isValid(settingId)) {
    throw new ApiError(400, "Invalid setting id.");
  }

  const setting = await settingRepository.softDeleteSetting(settingId);

  if (!setting) {
    throw new ApiError(404, "Setting not found.");
  }

  return setting;
};

export default {
  createSetting,
  getSettingById,
  getSettingByKey,
  getPublicSettings,
  getSettings,
  updateSetting,
  updateSettingByKey,
  deleteSetting,
};
