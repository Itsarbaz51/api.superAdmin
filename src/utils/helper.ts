import type { AuthRequest } from "../types/types.js";
import bcrypt from "bcryptjs";
import type { Response } from "express";
import Prisma from "../db/db.js";
import type ms from "ms";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.types.js";

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

  static generateAccessToken = (payload: JwtPayload) => {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET not defined in env");
    }

    const options: SignOptions = {
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue) || "15m",
    };

    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
  };

  static generateRefreshToken = (payload: Pick<JwtPayload, "id" | "email">) => {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error("REFRESH_TOKEN_SECRET not defined in env");
    }

    const options: SignOptions = {
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue) || "7d",
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
  };
}

export default Helper;
