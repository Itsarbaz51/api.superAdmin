import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import AuthServices from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

const cookieOptions: import("express").CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Parent id is missing");
    }

    const { user, accessToken } = await AuthServices.register({
      ...req.body,
      parentId: userId,
    });

    if (!user || !accessToken) {
      throw ApiError.internal("User creation failed!");
    }

    const safeUser = Helper.serializeUser(user);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          { user: safeUser, accessToken },
          "User created successfully",
          201
        )
      );
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken } = await AuthServices.login(req.body);

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        ApiResponse.success(
          { accessToken },
          `${safeUser.email} Login successful`,
          200
        )
      );
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    await AuthServices.logout(userId);

    res.clearCookie("accessToken", cookieOptions);
    return res
      .status(200)
      .json(ApiResponse.success(null, "Logout successful", 200));
  });

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
