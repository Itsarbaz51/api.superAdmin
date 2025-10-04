import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import RoleServices from "../services/role.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class RoleController {
  static index = asyncHandler(async (req: Request, res: Response) => {});

  static show = asyncHandler(async (req: Request, res: Response) => {});

  static store = asyncHandler(async (req: Request, res: Response) => {
    const createdBy = req?.user?.id;
    const userRole = req?.user?.role;

    if (!createdBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (userRole !== "SUPER ADMIN") {
      throw ApiError.forbidden("Insufficient permissions");
    }

    const role = await RoleServices.store({
      ...req.body,
      description: req.body.description ?? null,
      createdBy,
    });

    if (!role) {
      throw ApiError.internal("Failed to create role");
    }

    return res
      .status(201)
      .json(ApiResponse.success(role, "Role created successfully", 201));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {});

  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}

export default RoleController;
