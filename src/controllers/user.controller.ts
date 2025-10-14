// controllers/auth.controller.ts
import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";
import UserServices from "../services/user.service.js";

class UserController {
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id ?? req.user?.id;

    if (!userId) {
      logger.warn("Get user attempted without user ID");
      throw ApiError.badRequest("userId required");
    }

    const user = await UserServices.getUserById(userId);

    logger.debug("User data fetched", { userId });

    return res
      .status(200)
      .json(ApiResponse.success({ user }, "User fetched", 200));
  });

  static getAllUsersByRole = asyncHandler(
    async (req: Request, res: Response) => {
      const { roleId } = req.params;

      if (!roleId) {
        logger.warn("Get users by role attempted without role ID");
        throw ApiError.badRequest("roleId is required");
      }

      const users = await UserServices.getAllUsersByRole(roleId);

      logger.info("Users fetched by role", {
        roleId,
        count: users.length,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success({ users }, "Users fetched successfully", 200)
        );
    }
  );

  static getAllUsersByParentId = asyncHandler(
    async (req: Request, res: Response) => {
      const { parentId } = req.params;

      if (!parentId) {
        logger.warn("Get users by parent ID attempted without parent ID");
        throw ApiError.badRequest("parentId is required");
      }

      const users = await UserServices.getAllUsersByParentId(parentId);

      logger.info("Users fetched by parent", {
        parentId,
        count: users.length,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success({ users }, "Users fetched successfully", 200)
        );
    }
  );

  static getAllUsersByChildrenId = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      if (!userId) {
        logger.warn("Get children users attempted without user ID");
        throw ApiError.badRequest("userId is required");
      }

      const users = await UserServices.getAllUsersByChildrenId(userId);

      logger.info("Children users fetched", {
        userId,
        count: users.length,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { users },
            "Children users fetched successfully",
            200
          )
        );
    }
  );

  static getAllUsersCountByParentId = asyncHandler(
    async (req: Request, res: Response) => {
      const { parentId } = req.params;

      if (!parentId) {
        logger.warn("Get users count by parent attempted without parent ID");
        throw ApiError.badRequest("parentId is required");
      }

      const result = await UserServices.getAllUsersCountByParentId(parentId);

      logger.info("Users count by parent fetched", {
        parentId,
        count: result.count,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(result, "Users count fetched successfully", 200)
        );
    }
  );

  static getAllUsersCountByChildrenId = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = req.params;

      if (!userId) {
        logger.warn("Get children count attempted without user ID");
        throw ApiError.badRequest("userId is required");
      }

      const result = await UserServices.getAllUsersCountByChildrenId(userId);

      logger.info("Children count fetched", {
        userId,
        count: result.count,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            result,
            "Children count fetched successfully",
            200
          )
        );
    }
  );
}

export default UserController;
