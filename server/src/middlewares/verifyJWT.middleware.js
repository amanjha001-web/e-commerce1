import jwt from "jsonwebtoken";

import userRepository from "../repositories/user.repository.js";

import { asyncHandler, ApiError } from "../utils/index.js";

/*                          Verify JWT Middleware                             */

const verifyJWT = asyncHandler(async (req, res, next) => {
  /*                               Get Token                                  */

  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  /*                            Verify Token                                  */

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired access token");
  }

  /*                              Find User                                   */

  const user = await userRepository.getUserById(decoded._id);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  req.user = user;

  next();
});

export { verifyJWT };
