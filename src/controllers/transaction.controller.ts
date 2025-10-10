import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TransactionService } from "../services/transaction.service.js";
import Helper from "../utils/helper.js";

export class TransactionController {
  static createTransaction = asyncHandler(
    async (req: Request, res: Response) => {
      const transaction = await TransactionService.createTransaction(req.body);

      const safeTransaction = Helper.serializeUser(transaction);
      return res
        .status(201)
        .json(
          ApiResponse.success(
            safeTransaction,
            "Transaction created successfully",
            201
          )
        );
    }
  );

  static refundTransaction = asyncHandler(
    async (req: Request, res: Response) => {
      const refund = await TransactionService.refundTransaction(req.body);
      const safeRefund = Helper.serializeUser(refund);

      return res
        .status(200)
        .json(
          ApiResponse.success(safeRefund, "Refund processed successfully", 200)
        );
    }
  );

  static getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const transactions = await TransactionService.getTransactions(req.body);

    const safeTransaction = Helper.serializeUser(transactions);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          safeTransaction,
          "Transactions fetched successfully",
          200
        )
      );
  });

  static updateTransactionStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const updated = await TransactionService.updateTransactionStatus(
        req.body
      );
      const safeUpdated = Helper.serializeUser(updated);
      return res
        .status(200)
        .json(
          ApiResponse.success(
            safeUpdated,
            "Transaction status updated successfully",
            200
          )
        );
    }
  );
}
