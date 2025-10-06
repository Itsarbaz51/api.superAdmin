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

    // await AuthServices.createAndSendEmailVerification(user);

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
    const { user, accessToken, refreshToken } = await AuthServices.login(
      req.body
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
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
    res.clearCookie("refreshToken", cookieOptions);
    return res
      .status(200)
      .json(ApiResponse.success(null, "Logout successful", 200));
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const incomingRefresh = req.cookies?.refreshToken;

    if (!incomingRefresh) {
      throw ApiError.unauthorized("Refresh token missing");
    }

    const { accessToken, refreshToken, user } =
      await AuthServices.refreshToken(incomingRefresh);

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.cookie("accessToken", accessToken, cookieOptions);

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { accessToken, user: safeUser },
          "Token refreshed",
          200
        )
      );
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest("Email is required");
    }

    const result = await AuthServices.forgotPassword(email);

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw ApiError.badRequest("token and newPassword required");
    }

    const result = await AuthServices.resetPassword(token, newPassword);

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.id ?? req.user?.id;

    if (!userId) throw ApiError.badRequest("userId required");

    const user = await AuthServices.getUserById(userId);

    return res
      .status(200)
      .json(ApiResponse.success({ user }, "User fetched", 200));
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query; // token may come as query param from link

    if (!token) throw ApiError.badRequest("token required");

    const result = await AuthServices.verifyEmail(String(token));

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });
}

export default AuthController;
