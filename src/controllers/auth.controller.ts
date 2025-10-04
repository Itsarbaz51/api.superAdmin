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
    const { user, accessToken } = await AuthServices.register(req.body);

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
