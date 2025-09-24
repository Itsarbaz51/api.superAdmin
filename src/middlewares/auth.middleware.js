import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies.accessToken ||
    req.headers["authorization"].replace("Bearer ", "");

  if (!token) {
    return ApiError.send(res, 401, "Unauthorized: No token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    return ApiError.send(res, 401, "Unauthorized: Invalid/Expired token");
  }

  const userExsits = await Prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!userExsits) {
    return ApiError.send(res, 401, "Unauthorized: Invalid token user");
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  next();
});

export const authorizeRoles = (allowedRoles = []) =>
  asyncHandler(async (req, res) => {
    const userRole = req.user.role;

    if (!userRole) {
      return ApiError.send(res, 401, "Unauthorized: No role found");
    }

    if (!allowedRoles.includes(userRole)) {
      return ApiError.send(res, 403, "Forbidden: Insufficient privileges");
    }

    next();
  });
