import { Router } from "express";

import { fileController } from "../controllers/index.js";

import {
  authMiddleware,
  authorizeRoles,
  validate,
  uploadFile,
} from "../middlewares/index.js";

import {
  uploadFileSchema,
  getFilesSchema,
  updateFileSchema,
  deleteFileSchema,
  restoreFileSchema,
} from "../validators/index.js";

const router = Router();

/*                         Protected Routes                         */

router.use(authMiddleware);

/*                         Customer Only                            */

router.use(authorizeRoles("customer"));

/*                         Upload File                              */

router.post(
  "/",
  uploadFile,
  validate(uploadFileSchema),
  fileController.uploadFile,
);

/*                         Get My Files                              */

router.get("/", validate(getFilesSchema), fileController.getFiles);

/*                         Update File                               */

router.patch("/:id", validate(updateFileSchema), fileController.updateFile);

/*                         Delete File                               */

router.delete("/:id", validate(deleteFileSchema), fileController.deleteFile);

/*                         Restore File                              */

router.patch(
  "/restore/:id",
  validate(restoreFileSchema),
  fileController.restoreFile,
);

export default router;
