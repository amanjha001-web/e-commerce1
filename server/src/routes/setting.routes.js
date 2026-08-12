import { Router } from "express";

import {settingController} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";

const router = Router();

/*                              Public Routes                                 */

router.get("/public", settingController.getPublicSettings);

/*                              Admin Routes                                  */

router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  settingController.createSetting,
);

router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  settingController.getAllSettings,
);

router.get(
  "/key/:key",
  authMiddleware,
  authorize("ADMIN"),
  settingController.getSettingByKey,
);

router.get(
  "/:settingId",
  authMiddleware,
  authorize("ADMIN"),
  settingController.getSettingById,
);

router.patch(
  "/:settingId",
  authMiddleware,
  authorize("ADMIN"),
  settingController.updateSetting,
);

router.patch(
  "/key/:key",
  authMiddleware,
  authorize("ADMIN"),
  settingController.updateSettingByKey,
);

router.delete(
  "/:settingId",
  authMiddleware,
  authorize("ADMIN"),
  settingController.deleteSetting,
);

export default router;
