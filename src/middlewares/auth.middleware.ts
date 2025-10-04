import jwt from "jsonwebtoken";
import type { Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import Prisma from "../db/db.js";
import type { AuthRequest, TokenPayload } from "../types/auth.types.js";

class AuthMiddleware {
  static isAuthenticated = asyncHandler(
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const token =
        req.cookies?.accessToken ||
        req.headers["authorization"]?.replace("Bearer ", "");

      if (!token) {
        return ApiError.send(res, 401, "Unauthorized: No token provided");
      }

      let decoded: TokenPayload;
      try {
        decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET!
        ) as TokenPayload;
      } catch (error) {
        return ApiError.send(res, 401, "Unauthorized: Invalid/Expired token");
      }

      const userExists = await Prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!userExists) {
        return ApiError.send(res, 401, "Unauthorized: Invalid token user");
      }

      req.user = {
        id: userExists.id,
        email: userExists.email,
        role: userExists.role.name,
      };

      return next();
    }
  );

  static authorizeRoles = (allowedRoles: string[] = []) =>
    asyncHandler(
      async (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
          return ApiError.send(res, 401, "Unauthorized: No role found");
        }

        if (!allowedRoles.includes(userRole)) {
          return ApiError.send(res, 403, "Forbidden: Insufficient privileges");
        }

        return next();
      }
    );
}

export default AuthMiddleware;
