import { settingService } from '../../services/superAdmin/setting.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/apiResponse.js';

const extractActor = (req) => ({
  userId: req.user?._id,
  ipAddress: req.ip || '',
  userAgent: req.get?.('user-agent') || '',
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings();
  return ApiResponse.success(res, settings, 'System settings');
});

export const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getPublicSettings();
  return ApiResponse.success(res, settings, 'Storefront settings retrieved');
});

export const getSettingsHistory = asyncHandler(async (req, res) => {
  const history = await settingService.getSettingsHistory(req.query);
  return ApiResponse.success(res, history, 'Settings history retrieved');
});

export const getSettingByKey = asyncHandler(async (req, res) => {
  const value = await settingService.getSettingByKey(req.params.key);
  return ApiResponse.success(res, { key: req.params.key, value }, 'Setting value');
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = req.body?.settings || req.body;
  const settings = await settingService.updateMultipleSettings(data, extractActor(req));
  return ApiResponse.success(res, settings, 'Settings updated');
});

export const updateSetting = asyncHandler(async (req, res) => {
  const value = req.body?.value !== undefined ? req.body.value : req.body;
  const updated = await settingService.updateSetting(
    req.params.key,
    value,
    extractActor(req)
  );
  return ApiResponse.success(res, updated, 'Setting updated');
});
