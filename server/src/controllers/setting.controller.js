import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

import settingService from "../services/setting.service.js";

/*                           Create Setting                                   */

const createSetting = asyncHandler(async (req, res) => {
  const setting = await settingService.createSetting({
    ...req.body,
    updatedBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, setting, "Setting created successfully."));
});

/*                         Get Setting By Id                                  */

const getSettingById = asyncHandler(async (req, res) => {
  const { settingId } = req.params;

  const setting = await settingService.getSettingById(settingId);

  return res.json(
    new ApiResponse(200, setting, "Setting fetched successfully."),
  );
});

/*                        Get Setting By Key                                  */

const getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await settingService.getSettingByKey(key);

  return res.json(
    new ApiResponse(200, setting, "Setting fetched successfully."),
  );
});

/*                       Get Public Settings                                  */

const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getPublicSettings();

  return res.json(
    new ApiResponse(200, settings, "Public settings fetched successfully."),
  );
});

/*                        Get All Settings                                    */

const getAllSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings(req.query, req.query);

  return res.json(
    new ApiResponse(200, settings, "Settings fetched successfully."),
  );
});

/*                         Update Setting                                     */

const updateSetting = asyncHandler(async (req, res) => {
  const { settingId } = req.params;

  const setting = await settingService.updateSetting(settingId, {
    ...req.body,
    updatedBy: req.user._id,
  });

  return res.json(
    new ApiResponse(200, setting, "Setting updated successfully."),
  );
});

/*                      Update Setting By Key                                 */

const updateSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await settingService.updateSettingByKey(key, {
    ...req.body,
    updatedBy: req.user._id,
  });

  return res.json(
    new ApiResponse(200, setting, "Setting updated successfully."),
  );
});

/*                         Delete Setting                                     */

const deleteSetting = asyncHandler(async (req, res) => {
  const { settingId } = req.params;

  const setting = await settingService.deleteSetting(settingId);

  return res.json(
    new ApiResponse(200, setting, "Setting deleted successfully."),
  );
});

export default{
  createSetting,
  getSettingById,
  getSettingByKey,
  getPublicSettings,
  getAllSettings,
  updateSetting,
  updateSettingByKey,
  deleteSetting,
};
