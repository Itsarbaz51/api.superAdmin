import Prisma from "../db/db.js";
import ApiError from "./ApiError.js";
import bcrypt from "bcryptjs";

export const hashPassword = async (password) => {
  if (!password) throw new Error("Password is required for hashing.");
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return await bcrypt.compare(password, hashedPassword);
};

export const checkUserAuth = async (req, res, requiredRole = null) => {
  const user = req.user;

  if (!user?.id) {
    ApiError.send(res, 402, "Unauthorized access");
  }

  const userExists = await Prisma.user.findFirst({
    where: { id: user.id },
  });

  if (!userExists) {
    ApiError.send(
      res,
      404,
      "User not found or no permission to perform this action"
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    ApiError.send(res, 403, "Do not have permission");
    return null;
  }

  return userExists;
};
