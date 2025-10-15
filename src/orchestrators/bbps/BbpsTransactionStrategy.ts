// src/orchestrators/bbps/BbpsTransactionStrategy.ts
import { TxStatus, LedgerEntryType, ReferenceType } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import { WalletService } from "../../services/wallet.service.js";
import { BBPService } from "../../services/bbps.service.js";
import { BaseStrategy } from "../base/BaseStrategy.js";
import type { ITransactionStrategy } from "../../types/ITransactionStrategy.js";
import Prisma from "../../db/db.js";

import {
  BillerInfoCommand,
  BillerFetchCommand,
  BillPaymentCommand,
  TransactionStatusCommand,
  ComplaintRegisterCommand,
  ComplaintTrackingCommand,
  BillValidationCommand,
  PlanPullCommand,
} from "./index.js";

interface BBPSTransactionData {
  userId: string;
  serviceId: string;
  amount: number;
  billerId: string;
  customerParams: Record<string, string>;
  channel?: string;
  idempotencyKey?: string;
  createdBy?: string;
  operation?: BBPSOperation;
}

type BBPSOperation =
  | "BILLER_INFO"
  | "BILL_FETCH"
  | "BILL_PAYMENT"
  | "TRANSACTION_STATUS"
  | "COMPLAINT_REGISTER"
  | "COMPLAINT_TRACKING"
  | "BILL_VALIDATION"
  | "PLAN_PULL";

export class BbpsTransactionStrategy
  extends BaseStrategy
  implements ITransactionStrategy
{
  private commands: Map<BBPSOperation, any> = new Map();

  constructor() {
    super("BBPS_STRATEGY");
    this.initializeCommands();
  }

  private initializeCommands(): void {
    this.commands.set("BILLER_INFO", new BillerInfoCommand());
    this.commands.set("BILL_FETCH", new BillerFetchCommand());
    this.commands.set("BILL_PAYMENT", new BillPaymentCommand());
    this.commands.set("TRANSACTION_STATUS", new TransactionStatusCommand());
    this.commands.set("COMPLAINT_REGISTER", new ComplaintRegisterCommand());
    this.commands.set("COMPLAINT_TRACKING", new ComplaintTrackingCommand());
    this.commands.set("BILL_VALIDATION", new BillValidationCommand());
    this.commands.set("PLAN_PULL", new PlanPullCommand());
  }

  async process(data: BBPSTransactionData): Promise<any> {
    await this.validateInput(data);

    const operation = data.operation || "BILL_PAYMENT";
    const command = this.commands.get(operation);

    if (!command) {
      throw ApiError.badRequest(`Unsupported BBPS operation: ${operation}`);
    }

    this.logStart(data.idempotencyKey || "unknown", operation);

    try {
      const result = await command.execute(data);
      this.logSuccess(data.idempotencyKey || "unknown", operation, result);
      return result;
    } catch (error) {
      this.logError(data.idempotencyKey || "unknown", operation, error);
      throw error;
    }
  }

  protected async customValidation(data: BBPSTransactionData): Promise<void> {
    if (data.operation === "BILL_PAYMENT") {
      if (!data.amount || data.amount <= 0) {
        throw ApiError.badRequest("Valid amount is required for bill payment");
      }
      if (!data.billerId) {
        throw ApiError.badRequest("Biller ID is required");
      }
      if (
        !data.customerParams ||
        Object.keys(data.customerParams).length === 0
      ) {
        throw ApiError.badRequest("Customer parameters are required");
      }
    }

    // Validate user exists and is active
    const user = await Prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        id: true,
        status: true,
        wallets: { where: { isPrimary: true } },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("User account is not active");
    }

    if (
      data.operation === "BILL_PAYMENT" &&
      (!user.wallets || user.wallets.length === 0)
    ) {
      throw ApiError.badRequest("User primary wallet not found");
    }
  }
}
