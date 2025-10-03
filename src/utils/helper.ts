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
}

export default Helper;
