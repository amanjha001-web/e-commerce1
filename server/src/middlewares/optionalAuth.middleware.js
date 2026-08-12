import jwt from "jsonwebtoken";

import asyncHandler from "../utils/asyncHandler.js";

import userRepository from "../repositories/user.repository.js";

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userRepository.getUserById(decoded._id);

    if (!user || user.isBlocked) {
      req.user = null;
      return next();
    }

    req.user = user;

    next();
  } catch (error) {
    req.user = null;

    next();
  }
});

export default optionalAuth;
