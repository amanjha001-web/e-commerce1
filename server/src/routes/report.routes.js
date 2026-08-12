import { Router } from "express";

import {reportController} from "../controllers/index.js";

import {authMiddleware} from "../middlewares/index.js";
import { authorize } from "../middlewares/index.js";

const router = Router();

/*                             Create Report                                  */

router.post("/", authMiddleware, reportController.createReport);

/*                          Get My Reports                                   */

router.get("/my-reports", authMiddleware, reportController.getMyReports);

/*                          Get Single Report                                */

router.get("/:reportId", authMiddleware, reportController.getReportById);

/*                           Admin Reports                                  */

router.get(
  "/admin/all",
  authMiddleware,
  authorize("ADMIN"),
  reportController.getAllReports,
);

/*                           Update Report                                   */

router.patch("/:reportId", authMiddleware, reportController.updateReport);

/*                           Resolve Report                                  */

router.patch(
  "/:reportId/resolve",
  authMiddleware,
  authorize("ADMIN"),
  reportController.resolveReport,
);

/*                           Delete Report                                   */

router.delete("/:reportId", authMiddleware, reportController.deleteReport);

export default router;
