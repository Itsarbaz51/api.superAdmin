import Prisma from "../db/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";
import { checkUserAuth } from "../utils/lib.js";

// ================= add roles =========================
export const createRole = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { name } = req.body;

  if (!name || !name.trim()) {
    return ApiError.send(res, 403, "Role name is required");
  }

  const checkedName = name.trim().replace(/\s+/g, "_").toUpperCase();

  const roleExist = await Prisma.role.findFirst({
    where: { name: checkedName },
  });

  if (roleExist) {
    return ApiError.send(res, 403, "Role already exists");
  }

  const newRole = await Prisma.role.create({
    data: { name: checkedName },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Role created successfully", newRole));
});

// ================= update roles =========================
export const updateRole = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;
  const { name } = req.body;

  if (!id) {
    return ApiError.send(res, 403, "Role ID is required");
  }

  if (!name || !name.trim()) {
    return ApiError.send(res, 403, "Role name is required");
  }

  const checkedName = name.trim().replace(/\s+/g, "_").toUpperCase();

  const roleExist = await Prisma.role.findUnique({
    where: { id },
  });

  if (!roleExist) {
    return ApiError.send(res, 404, "Role not found");
  }

  const duplicateRole = await Prisma.role.findFirst({
    where: { name: checkedName, id },
  });

  if (duplicateRole) {
    return ApiError.send(
      res,
      403,
      "Another role with this name already exists"
    );
  }

  const updatedRole = await Prisma.role.update({
    where: { id },
    data: { name: checkedName },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Role updated successfully", updatedRole));
});

// ================= delete roles =========================
export const deleteRole = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, "SUPER_ADMIN");
  if (!userExists) return;

  const { id } = req.params;

  if (!id) {
    return ApiError.send(res, 403, "Role ID is required");
  }

  const roleExist = await Prisma.role.findUnique({
    where: { id },
  });

  if (!roleExist) {
    return ApiError.send(res, 404, "Role not found");
  }

  await Prisma.role.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Role deleted successfully", null));
});

// ================= get all roles =========================
export const getAllRoles = asyncHandler(async (req, res) => {
  const userExists = await checkUserAuth(req, res, req.role);
  if (!userExists) return;

  let roles;
  if (req.role === "SUPER_ADMIN") {
    roles = await Prisma.role.findMany();
  } else if (req.role === "ADMIN") {
    roles = await Prisma.role.findMany({
      where: {
        name: {
          not: "SUPER_ADMIN",
          not: "ADMIN",
        },
      },
    });
  } else if (req.role === "STATE_HEAD") {
    roles = await Prisma.role.findMany({
      where: {
        name: {
          not: "SUPER_ADMIN",
          not: "ADMIN",
          not: "STATE_HEAD",
        },
      },
    });
  } else if (req.role === "MASTER_DISTRIBUTOR") {
    roles = await Prisma.role.findMany({
      where: {
        name: {
          not: "SUPER_ADMIN",
          not: "ADMIN",
          not: "STATE_HEAD",
          not: "MASTER_DISTRIBUTOR",
        },
      },
    });
  } else if (req.role === "DISTRIBUTOR") {
    roles = await Prisma.role.findMany({
      where: {
        name: {
          not: "SUPER_ADMIN",
          not: "ADMIN",
          not: "STATE_HEAD",
          not: "MASTER_DISTRIBUTOR",
          not: "DISTRIBUTOR",
        },
      },
    });
  }
  
  if (!roles || roles.length === 0) {
    return ApiError.send(res, 404, "No roles found");
  }

  return res.status(200).json(new ApiResponse(200, "Fetched all roles", roles));
});
