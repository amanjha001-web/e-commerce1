import { Router } from "express";

import {
  addressController
} from "../controllers/index.js";

import { authMiddleware } from "../middlewares/index.js";
import {authorizeRoles} from "../middlewares/index.js";
import {validate} from "../middlewares/index.js";

import {
  addAddressSchema,
  updateAddressSchema,
  deleteAddressSchema,
  setDefaultAddressSchema,
} from "../validators/index.js";

const router = Router();


/*                             Protected Routes                               */


router.use(authMiddleware);
router.use(authorizeRoles("customer"));

router.post("/", validate(addAddressSchema), addressController.addAddress);

router.get("/", addressController.getAddresses);

router.patch("/:id", validate(updateAddressSchema), addressController.updateAddress);

router.patch(
  "/default/:id",
  validate(setDefaultAddressSchema),
  addressController.setDefaultAddress,
);

router.delete("/:id", validate(deleteAddressSchema), addressController.deleteAddress);

export default router;
