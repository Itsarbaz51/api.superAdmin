import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import Prisma from "../db/db.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token =
    req?.cookies?.accessToken ||
    req?.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    return ApiError.send(res, 401, "Unauthorized: No token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return ApiError.send(res, 401, "Unauthorized: Invalid/Expired token");
  }

  const userExists = await Prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!userExists) {
    return ApiError.send(res, 401, "Unauthorized: Invalid token user");
  }

  req.user = {
    id: userExists.id,
    email: userExists.email,
    role: userExists.role,
  };

  return next();
});

export const authorizeRoles = (allowedRoles = []) =>
  asyncHandler(async (req, res, next) => {
    const userRole = req.user.role;

    if (!userRole) {
      return ApiError.send(res, 401, "Unauthorized: No role found");
    }

    if (!allowedRoles.includes(userRole)) {
      return ApiError.send(res, 403, "Forbidden: Insufficient privileges");
    }

    return next();
  });
