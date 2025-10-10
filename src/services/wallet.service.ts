import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class WalletService {
  static async getWalletByUserId(userId: string) {
    const wallet = await Prisma.wallet.findUnique({
      where: { userId },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!wallet) {
      throw new ApiError("Wallet not found for user", 404);
    }

    // ✅ Ensure latest balance consistency
    const latestLedger = wallet.ledgerEntries[0];
    const currentBalance = latestLedger
      ? latestLedger.runningBalance
      : wallet.balance;

    return {
      ...wallet,
      balance: currentBalance,
    };
  }

  static async creditWallet(
    userId: string,
    amount: number,
    narration?: string,
    createdBy?: string
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw ApiError.notFound("Wallet not found");

      const newBalance = BigInt(wallet.balance ?? 0n) + BigInt(amount);

      const ledger = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: "CREDIT",
          amount: BigInt(amount),
          runningBalance: newBalance,
          narration: narration ?? "Wallet credited",
          createdBy: createdBy ?? userId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return {
        walletId: wallet.id,
        userId,
        newBalance,
        ledger,
      };
    });
  }

  static async debitWallet(
    userId: string,
    amount: number,
    narration?: string,
    createdBy?: string
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw ApiError.notFound("Wallet not found");

      const balance = BigInt(wallet.balance ?? 0n);
      if (balance < BigInt(amount)) {
        throw ApiError.badRequest("Insufficient balance");
      }

      const newBalance = balance - BigInt(amount);

      const ledger = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: "DEBIT",
          amount: BigInt(amount),
          runningBalance: newBalance,
          narration: narration ?? "Wallet debited",
          createdBy: createdBy ?? userId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return {
        walletId: wallet.id,
        userId,
        newBalance,
        ledger,
      };
    });
  }
}
