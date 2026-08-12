import { Router } from "express";

import {fileController} from "../controllers/index.js";

import {authMiddleware as verifyJWT} from "../middlewares/index.js";

const router = Router();

/*                              Create File                                   */

router.post("/", verifyJWT, fileController.createFile);

/*                           Get Single File                                  */

router.get("/:fileId", verifyJWT, fileController.getFileById);

/*                           My Files                                         */

router.get("/my-files", verifyJWT, fileController.getMyFiles);

/*                           All Files                                        */

router.get("/", verifyJWT, fileController.getFiles);

/*                           Update File                                      */

router.patch("/:fileId", verifyJWT, fileController.updateFile);

/*                           Soft Delete                                      */

router.delete("/:fileId", verifyJWT, fileController.deleteFile);

/*                           Restore File                                     */

router.patch("/:fileId/restore", verifyJWT, fileController.restoreFile);

/*                       Permanent Delete                                     */

router.delete(
  "/:fileId/permanent",
  verifyJWT,
  fileController.deleteFileForever,
);

export default router;
