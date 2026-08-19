import { Router } from "express";

import { settingController } from "../controllers/index.js";

import { validate } from "../middlewares/index.js";
import settingValidator from "../validators/setting.validator.js";
import { authMiddleware } from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";

const router = Router();

/*                              Public Routes                                 */

router.get("/public", settingController.getPublicSettings);

/*                              Admin Routes                                  */

router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(settingValidator.createSetting),
  settingController.createSetting,
);

router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  validate(settingValidator.getSettings),
  settingController.getAllSettings,
);

router.get(
  "/key/:key",
  authMiddleware,
  authorize("admin"),
  validate(settingValidator.settingKeyParam),
  settingController.getSettingByKey,
);

router.get(
  "/:settingId",
  authMiddleware,
  authorize("admin"),
  validate(settingValidator.settingIdParam),
  settingController.getSettingById,
);

router.patch(
  "/:settingId",
  authMiddleware,
  authorize("admin"),
  validate(settingValidator.updateSetting),
  settingController.updateSetting,
);

router.patch(
  "/key/:key",
  authMiddleware,
  authorize("admin"),
  settingController.updateSettingByKey,
);

router.delete(
  "/:settingId",
  authMiddleware,
  authorize("admin"),
  validate(settingValidator.settingIdParam),
  settingController.deleteSetting,
);

export default router;
