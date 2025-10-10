import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { WalletService } from "../services/wallet.service.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

export class WalletController {
  static getWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("Invalid userId format");
    }

    const wallet = await WalletService.getWalletByUserId(userId);
    const safeWallet = Helper.serializeUser(wallet);

    return res
      .status(200)
      .json(
        ApiResponse.success(safeWallet, "Wallet fetched successfully", 200)
      );
  });

  static creditWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, narration } = req.body;

    if (!userId || !amount || !narration) {
      throw ApiError.badRequest("Missing required fields: userId or amount and narration");
    }

    const result = await WalletService.creditWallet(
      userId,
      Number(amount),
      narration,
      req.user?.id
    );

    const safeResult = Helper.serializeUser(result);
    return res
      .status(200)
      .json(
        ApiResponse.success(safeResult, "Wallet credited successfully", 200)
      );
  });

  static debitWallet = asyncHandler(async (req: Request, res: Response) => {
    const { userId, amount, narration } = req.body;

    if (!userId || !amount) {
      throw ApiError.badRequest("Missing required fields: userId or amount");
    }

    const result = await WalletService.debitWallet(
      userId,
      Number(amount),
      narration,
      req.user?.id
    );

    const safeResult = Helper.serializeUser(result);
    return res
      .status(200)
      .json(
        ApiResponse.success(safeResult, "Wallet debited successfully", 200)
      );
  });
}
