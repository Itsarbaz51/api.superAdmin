import Prisma from "../db/db.js";
import { Prisma as prisma } from "@prisma/client";
import type {
  CreateTransactionDTO,
  GetTransactionsFilters,
  RefundTransactionDTO,
  UpdateTransactionStatusDTO,
} from "../types/transaction.types.js";
import { ApiError } from "../utils/ApiError.js";

export class TransactionService {
  // ---------------- CREATE TRANSACTION ----------------
  static async createTransaction(data: CreateTransactionDTO) {
    const {
      userId,
      walletId,
      serviceId,
      providerId,
      amount,
      commissionAmount,
      idempotencyKey,
      referenceId,
      requestPayload,
    } = data;

    const wallet = await Prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw ApiError.notFound("Wallet not found");

    if (wallet.balance < BigInt(amount)) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transaction = await Prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          userId,
          walletId,
          serviceId,
          providerId: providerId ?? null,
          amount: BigInt(amount),
          commissionAmount: BigInt(commissionAmount),
          netAmount: BigInt(amount) - BigInt(commissionAmount),
          referenceId: referenceId ?? null,
          idempotencyKey: idempotencyKey ?? null,
          requestPayload: requestPayload
            ? (requestPayload as prisma.InputJsonValue)
            : prisma.JsonNull,
          status: "PENDING",
        },
      });

      const runningBalance = wallet.balance - BigInt(amount);

      await tx.ledgerEntry.create({
        data: {
          walletId,
          transactionId: newTx.id,
          entryType: "DEBIT",
          amount: BigInt(amount),
          runningBalance,
          narration: `Transaction initiated for service ${serviceId}`,
          createdBy: userId,
        },
      });

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: BigInt(amount) } },
      });

      return newTx;
    });

    return transaction;
  }

  // ---------------- REFUND TRANSACTION ----------------
  static async refundTransaction(data: RefundTransactionDTO) {
    const { transactionId, initiatedBy, amount, reason } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (transaction.status !== "SUCCESS")
      throw ApiError.badRequest("Only successful transactions can be refunded");

    if (!transaction.walletId) throw new ApiError("Wallet not linked", 400);

    const refund = await Prisma.$transaction(async (tx) => {
      const latestLedger = await tx.ledgerEntry.findFirst({
        where: { walletId: transaction.walletId },
        orderBy: { createdAt: "desc" },
      });

      const runningBalance =
        (latestLedger?.runningBalance ?? BigInt(0)) + BigInt(amount);

      const refundRecord = await tx.refund.create({
        data: {
          transactionId,
          initiatedBy,
          amount: BigInt(amount),
          reason,
          status: "SUCCESS",
        },
      });

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: { increment: BigInt(amount) } },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: transaction.walletId,
          transactionId,
          entryType: "CREDIT",
          amount: BigInt(amount),
          runningBalance,
          narration: `Refund processed for transaction ${transactionId}`,
          createdBy: initiatedBy,
        },
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "REFUNDED" },
      });

      return refundRecord;
    });

    return refund;
  }

  // ---------------- GET TRANSACTIONS ----------------
  static async getTransactions(filters: GetTransactionsFilters) {
    const { userId, status, serviceId, page, limit } = filters;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Prisma.$transaction([
      Prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      Prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit },
    };
  }

  // ---------------- UPDATE TRANSACTION STATUS ----------------
  static async updateTransactionStatus(data: UpdateTransactionStatusDTO) {
    const { transactionId, status, responsePayload } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (transaction.status !== "PENDING")
      throw ApiError.badRequest("Only pending transactions can be updated");

    if (!transaction.walletId) throw ApiError.badRequest("Wallet not linked");

    const updatedTx = await Prisma.$transaction(async (tx) => {
      // Update transaction
      const txUpdate = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status,
          responsePayload: responsePayload
            ? (responsePayload as prisma.InputJsonValue)
            : prisma.JsonNull,
          completedAt: new Date(),
        },
      });

      const latestLedger = await tx.ledgerEntry.findFirst({
        where: { walletId: transaction.walletId! },
        orderBy: { createdAt: "desc" },
      });

      const runningBalance =
        latestLedger?.runningBalance ?? transaction.wallet!.balance;

      await tx.ledgerEntry.create({
        data: {
          walletId: transaction.walletId!,
          transactionId,
          entryType: status === "SUCCESS" ? "DEBIT" : "CREDIT",
          amount: transaction.amount,
          runningBalance:
            status === "SUCCESS"
              ? runningBalance
              : runningBalance + transaction.amount,
          narration:
            status === "SUCCESS"
              ? `Transaction ${transactionId} marked as SUCCESS`
              : `Transaction ${transactionId} failed — amount reversed`,
          createdBy: transaction.userId,
        },
      });

      // Wallet update for FAILED
      if (status === "FAILED") {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        });
      }

      return txUpdate;
    });

    return updatedTx;
  }
}
