import type { AuthRequest } from "../types/types.js";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import Prisma from "../db/db.js";
import { ApiError } from "./ApiError.js";

class Helper {
  static async hashPassword(password: string): Promise<string> {
    if (!password) throw new Error("Password is required for hashing.");
    return await bcrypt.hash(password, 10);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    if (!password || !hashedPassword) return false;
    return await bcrypt.compare(password, hashedPassword);
  }

  static async checkUserAuth(
    req: AuthRequest,
    res: Response,
    requiredRole: string | null = null
  ) {
    const user = req.user;

    if (!user || !user.id) {
      return ApiError.send(res, 401, "Unauthorized access");
    }

    const userExists = await Prisma.user.findFirst({
      where: { id: user.id },
    });

    if (!userExists) {
      return ApiError.send(
        res,
        404,
        "User not found or no permission to perform this action"
      );
    }

    if (requiredRole && user.role !== requiredRole) {
      return ApiError.send(res, 403, "Do not have permission");
    }

    return userExists;
  }
}

export default Helper;
