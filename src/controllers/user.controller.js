import Prisma from "../db/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";
import { checkUserAuth, hashPassword } from "../utils/lib.js";

// ================ Create user by SUPER_ADMIN ================
export const createUser = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { name, email, phone, role, password, status } = req.body;

  if (!name || !email || !phone || !role || !password || !status) {
    return ApiError.send(res, 403, "All fields are required");
  }

  const exists = await Prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (exists) {
    return ApiError.send(
      res,
      400,
      `${role} already exists with same email/phone`
    );
  }

  const hashedPassword = await hashPassword(password);
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser = await Prisma.user.create({
    data: {
      name,
      email,
      phone,
      parentId: userExists.id,
      pin: pinCode,
      password: hashedPassword,
      role,
      isAuthorized: true,
      status: status ? status : "IN_ACTIVE",
    },
  });

  if (!newUser) {
    return ApiError.send(res, 500, `${role} not created | Server Error`);
  }

  const { password: _, ...safeUser } = newUser;
  return res
    .status(201)
    .json(new ApiResponse(201, `${role} created successfully`, safeUser));
});

// ================ Get all users by SUPER_ADMIN ================
export const getAllUsers = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const users = await Prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  if (!users || users.length === 0) {
    return ApiError.send(res, 404, "No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Fetched all admins", users));
});

// ================ Get user by ID ================
export const getUserById = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;

  if (!id) {
    return ApiError.send(res, 400, "User ID is required");
  }

  const user = await Prisma.user.findUnique({ where: { id } });

  if (!user) {
    return ApiError.send(res, 404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, "User fetched", user));
});

// ================ Update user by ID ================
export const updateUserById = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;
  const { id } = req.params;
  if (!id) {
    return ApiError.send(res, 400, "User ID is required");
  }

  const { name, email, phone, role, status } = req.body;
  if (!name && !email && !phone && !status) {
    return ApiError.send(res, 403, "At least one field is required to update");
  }

  const user = await Prisma.user.findUnique({ where: { id } });
  if (!user) {
    return ApiError.send(res, 404, "User not found");
  }
  const updateData = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (role) updateData.role = role;
  if (status) updateData.status = status;

  updateData.updatedAt = new Date();
  const updatedUser = await Prisma.user.update({
    where: { id },
    data: updateData,
  });

  if (!updatedUser) {
    return ApiError.send(res, 500, "User not updated | Server Error");
  }

  const { password: _, ...safeUser } = updatedUser;

  return res
    .status(200)
    .json(new ApiResponse(200, "User updated successfully", safeUser));
});

// ================ Delete user by ID ================
export const deleteUserById = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;
  if (!id) return ApiError.send(res, 400, "User ID is required");

  const user = await Prisma.user.findUnique({ where: { id } });
  if (!user) return ApiError.send(res, 404, "User not found");

  await Prisma.user.update({
    where: { id },
    data: { isDeleted: true, status: "DELETED" },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User soft deleted successfully"));
});

// ================ Update user status by ID and super admin ================
export const updateStatus = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;
  const { status } = req.body;

  if (!id) {
    return ApiError.send(res, 400, "User ID is required");
  }

  if (!status) {
    return ApiError.send(res, 400, "Status is required");
  }

  const user = await Prisma.user.findUnique({ where: { id } });
  if (!user) {
    return ApiError.send(res, 404, "User not found");
  }
  const updatedUser = await Prisma.user.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  });

  if (!updatedUser) {
    return ApiError.send(res, 500, "User status not updated | Server Error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User status updated successfully", status));
});
