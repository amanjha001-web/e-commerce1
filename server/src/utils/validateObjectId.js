import mongoose from "mongoose";
import ApiError from "./ApiError.js";

/*                         Validate Mongo ObjectId                            */

const validateObjectId = (id, fieldName = "Id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }

  return true;
};

/*                        Validate Multiple ObjectIds                         */

const validateObjectIds = (ids = [], fieldName = "Id") => {
  ids.forEach((id) => {
    validateObjectId(id, fieldName);
  });

  return true;
};

/*                                  Export                                    */

export { validateObjectId, validateObjectIds };
