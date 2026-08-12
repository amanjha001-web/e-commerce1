import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

/*                      Validate MongoDB ObjectId                             */

const validateObjectId = (...params) => {
  return (req, res, next) => {
    for (const param of params) {
      const value = req.params[param];

      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return next(new ApiError(400, `Invalid ${param} id`));
      }
    }

    next();
  };
};

export default validateObjectId;
