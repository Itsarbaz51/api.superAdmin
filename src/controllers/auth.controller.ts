import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import AuthValidationSchemas from "../validations/authValidation.schemas.js";
import AuthServices from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const payload = await AuthValidationSchemas.register.parseAsync(req.body);

    const { user, accessToken } = await AuthServices.register(payload);

    if (!user || !accessToken) {
      throw ApiError.internal("User creation failed!");
    }

    return res
      .status(201)
      .json(
        ApiResponse.success(
          { user, accessToken },
          "User created successfully",
          201
        )
      );
  });

  static login = asyncHandler(async (req: Request, res: Response) => {});

  static logout = asyncHandler(async (req: Request, res: Response) => {});

  static refresh = asyncHandler(async (req: Request, res: Response) => {});

  static forgotPassword = asyncHandler(
    async (req: Request, res: Response) => {}
  );

  static resetPassword = asyncHandler(
    async (req: Request, res: Response) => {}
  );

  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {});
}

export default AuthController;
