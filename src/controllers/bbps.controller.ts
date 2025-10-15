// src/controllers/bbps.controller.ts
import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TransactionOrchestratorFactory } from "../factories/TransactionOrchestratorFactory.js";
import Helper from "../utils/helper.js";

export class BBPSController {
  static getBillers = asyncHandler(async (req: Request, res: Response) => {
    const { category, search, page, limit } = req.query;

    const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
    const result = await strategy.process({
      operation: "BILLER_INFO",
      category: category as string,
      search: search as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
      userId: req.user?.id,
      serviceId: req.body.serviceId,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "BBPS billers fetched successfully", 200)
      );
  });

  static fetchBill = asyncHandler(async (req: Request, res: Response) => {
    const { billerId, customerParams } = req.body;

    const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
    const result = await strategy.process({
      operation: "BILLER_FETCH",
      billerId,
      customerParams,
      userId: req.user?.id,
      serviceId: req.body.serviceId,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Bill details fetched successfully", 200)
      );
  });

  static payBill = asyncHandler(async (req: Request, res: Response) => {
    const idempotencyKey = req.idempotencyKey;
    const { serviceId, amount, billerId, customerParams, channel } = req.body;

    const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
    const result = await strategy.process({
      operation: "BILL_PAYMENT",
      userId: req.user?.id,
      serviceId,
      amount,
      billerId,
      customerParams,
      channel: channel || "BBPS",
      idempotencyKey,
      createdBy: req.user?.id,
    });

    const safeResult = Helper.serializeUser(result);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          safeResult,
          "BBPS bill payment processed successfully",
          201
        )
      );
  });

  static getTransactionStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { bbpsTxnId, mobileNumber } = req.query;

      const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
      const result = await strategy.process({
        operation: "TRANSACTION_STATUS",
        bbpsTxnId: bbpsTxnId as string,
        mobileNumber: mobileNumber as string,
        userId: req.user?.id,
      });

      return res
        .status(200)
        .json(
          ApiResponse.success(
            result,
            "Transaction status fetched successfully",
            200
          )
        );
    }
  );

  static registerComplaint = asyncHandler(
    async (req: Request, res: Response) => {
      const { bbpsTxnId, category, subCategory, details, consumerMobile } =
        req.body;

      const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
      const result = await strategy.process({
        operation: "COMPLAINT_REGISTER",
        bbpsTxnId,
        category,
        subCategory,
        details,
        consumerMobile,
        userId: req.user?.id,
      });

      return res
        .status(201)
        .json(
          ApiResponse.success(result, "Complaint registered successfully", 201)
        );
    }
  );

  static trackComplaint = asyncHandler(async (req: Request, res: Response) => {
    const { complaintId } = req.params;

    const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
    const result = await strategy.process({
      operation: "COMPLAINT_TRACKING",
      complaintId,
      userId: req.user?.id,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Complaint status fetched successfully",
          200
        )
      );
  });

  static validateBill = asyncHandler(async (req: Request, res: Response) => {
    const { billerId, customerParams, amount } = req.body;

    const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
    const result = await strategy.process({
      operation: "BILL_VALIDATION",
      billerId,
      customerParams,
      amount,
      userId: req.user?.id,
    });

    return res
      .status(200)
      .json(ApiResponse.success(result, "Bill validation completed", 200));
  });

  static pullPlans = asyncHandler(async (req: Request, res: Response) => {
    const { billerId } = req.params;

    const strategy = TransactionOrchestratorFactory.getStrategy("BBPS");
    const result = await strategy.process({
      operation: "PLAN_PULL",
      billerId,
      userId: req.user?.id,
    });

    return res
      .status(200)
      .json(ApiResponse.success(result, "Plans fetched successfully", 200));
  });
}
