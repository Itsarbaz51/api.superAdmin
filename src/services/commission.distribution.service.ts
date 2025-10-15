// src/services/commission.distribution.service.ts
import {
  LedgerEntryType,
  ReferenceType,
  CommissionType,
  CommissionScope,
  Prisma,
} from "@prisma/client";
import PrismaClient from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

interface CommissionChainMember {
  userId: string;
  roleId: string;
  commissionType: CommissionType;
  commissionValue: any;
  level: number;
}

interface CommissionPayout {
  fromUserId: string;
  toUserId: string;
  amount: bigint;
  level: number;
  commissionType: CommissionType;
  commissionValue: any;
  narration: string;
}

interface TransactionForCommission {
  id: string;
  userId: string;
  serviceId: string;
  amount: bigint;
  channel?: string | null;
  providerCharge?: bigint;
}

interface UserChain {
  id: string;
  parentId: string | null;
  roleId: string;
}

interface CommissionCalculation {
  userId: string;
  amount: bigint;
  level: number;
  commissionType: CommissionType;
  commissionValue: any;
}

export class CommissionDistributionService {
  static async getCommissionChain(
    userId: string,
    serviceId: string,
    channel: string | null = null
  ): Promise<CommissionChainMember[]> {
    const chain: UserChain[] = [];
    let currentUser = await PrismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true, parentId: true, roleId: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    // Start with the transaction user and walk up the hierarchy
    let depth = 0;
    while (currentUser && depth < 50) {
      chain.unshift(currentUser);
      if (!currentUser.parentId) break;

      const nextUser: UserChain | null = await PrismaClient.user.findUnique({
        where: { id: currentUser.parentId },
        select: { id: true, parentId: true, roleId: true },
      });

      currentUser = nextUser || null;
      depth++;
    }

    const results: CommissionChainMember[] = [];

    for (let i = 0; i < chain.length; i++) {
      const user = chain[i];
      if (!user) continue;

      // Priority 1: User-specific commission settings
      const userSetting = await PrismaClient.commissionSetting.findFirst({
        where: {
          scope: CommissionScope.USER,
          targetUserId: user.id,
          serviceId,
          isActive: true,
          ...(channel !== null ? { channel } : { channel: null }),
        },
        orderBy: { effectiveFrom: "desc" },
      });

      if (userSetting) {
        results.push({
          userId: user.id,
          roleId: user.roleId,
          commissionType: userSetting.commissionType,
          commissionValue: userSetting.commissionValue,
          level: i + 1,
        });
        continue;
      }

      // Priority 2: Role-based commission settings
      if (user.roleId) {
        const roleSetting = await PrismaClient.commissionSetting.findFirst({
          where: {
            scope: CommissionScope.ROLE,
            roleId: user.roleId,
            serviceId,
            isActive: true,
            ...(channel !== null ? { channel } : { channel: null }),
          },
          orderBy: { effectiveFrom: "desc" },
        });

        if (roleSetting) {
          results.push({
            userId: user.id,
            roleId: user.roleId,
            commissionType: roleSetting.commissionType,
            commissionValue: roleSetting.commissionValue,
            level: i + 1,
          });
          continue;
        }
      }

      // If no commission setting found, add with zero commission
      results.push({
        userId: user.id,
        roleId: user.roleId,
        commissionType: CommissionType.FLAT,
        commissionValue: 0,
        level: i + 1,
      });
    }

    return results;
  }

  static calculateCommissionAmount(
    baseAmount: bigint,
    commissionType: CommissionType,
    commissionValue: any
  ): bigint {
    const commissionValueStr = commissionValue ? String(commissionValue) : "0";

    if (commissionType === CommissionType.FLAT) {
      const parsed = parseFloat(commissionValueStr) || 0;
      return BigInt(Math.round(parsed * 100));
    } else {
      const percent = parseFloat(commissionValueStr) || 0;
      const percentFixed = Math.round(percent * 100);
      return (baseAmount * BigInt(percentFixed)) / BigInt(10000);
    }
  }

  /**
   * CORRECTED: Hierarchical commission calculation
   * Top-down approach where each level gets commission on remaining amount
   */
  static calculateHierarchicalCommissions(
    chain: CommissionChainMember[],
    baseAmount: bigint
  ): CommissionCalculation[] {
    const commissions: CommissionCalculation[] = [];

    // Reverse chain for top-down calculation: Super Admin → Admin → User
    const reversedChain = [...chain].reverse();
    let remainingAmount = baseAmount;

    for (const member of reversedChain) {
      const commission = this.calculateCommissionAmount(
        remainingAmount,
        member.commissionType,
        member.commissionValue
      );

      commissions.unshift({
        userId: member.userId,
        amount: commission,
        level: member.level,
        commissionType: member.commissionType,
        commissionValue: member.commissionValue,
      });

      // Next level gets commission on the remaining amount after this commission
      remainingAmount = baseAmount - commission;
    }

    return commissions;
  }

  /**
   * CORRECTED: Calculate payout flow based on hierarchical commissions
   */
  static calculateCommissionPayouts(
    commissions: CommissionCalculation[],
    transactionId: string
  ): CommissionPayout[] {
    const payouts: CommissionPayout[] = [];

    if (commissions.length === 0) return payouts;

    // FIXED: Add null checks for array access
    const topLevel = commissions[commissions.length - 1];
    if (!topLevel) return payouts;

    // SYSTEM pays the top level (highest level)
    payouts.push({
      fromUserId: "SYSTEM",
      toUserId: topLevel.userId,
      amount: topLevel.amount,
      level: topLevel.level,
      commissionType: topLevel.commissionType,
      commissionValue: topLevel.commissionValue,
      narration: `Top-level commission from BBPS Provider for transaction ${transactionId}`,
    });

    // Downward distribution from top to bottom
    for (let i = commissions.length - 1; i > 0; i--) {
      const payer = commissions[i];
      const receiver = commissions[i - 1];

      // FIXED: Add null checks
      if (!payer || !receiver) continue;

      payouts.push({
        fromUserId: payer.userId,
        toUserId: receiver.userId,
        amount: receiver.amount,
        level: receiver.level,
        commissionType: receiver.commissionType,
        commissionValue: receiver.commissionValue,
        narration: `Commission share from ${payer.userId} for transaction ${transactionId}`,
      });
    }

    return payouts;
  }

  static async distribute(
    transaction: TransactionForCommission,
    createdBy: string
  ) {
    const { id: transactionId, serviceId, amount: txAmount } = transaction;
    const baseAmount = BigInt(txAmount);

    const chain = await this.getCommissionChain(
      transaction.userId,
      serviceId,
      transaction.channel
    );

    if (chain.length === 0) {
      logger.info("No commission chain found", { transactionId });
      return [];
    }

    logger.info("Commission chain found", {
      transactionId,
      chainLength: chain.length,
      userIds: chain.map((m) => m.userId),
    });

    // ✅ CORRECTED: Use hierarchical commission calculation
    const hierarchicalCommissions = this.calculateHierarchicalCommissions(
      chain,
      baseAmount
    );

    logger.info("Hierarchical commissions calculated", {
      transactionId,
      commissions: hierarchicalCommissions.map((c) => ({
        userId: c.userId,
        level: c.level,
        amount: Number(c.amount) / 100,
      })),
    });

    // ✅ CORRECTED: Calculate payout flow
    const payouts = this.calculateCommissionPayouts(
      hierarchicalCommissions,
      transactionId
    );

    if (payouts.length === 0) {
      logger.info("No commission payouts calculated", { transactionId });
      return [];
    }

    logger.info("Commission payouts calculated", {
      transactionId,
      payouts: payouts.map((p) => ({
        from: p.fromUserId,
        to: p.toUserId,
        amount: Number(p.amount) / 100,
        level: p.level,
      })),
    });

    // Execute all payouts atomically
    const createdEarnings = await PrismaClient.$transaction(async (tx) => {
      const earnings = [];

      for (const payout of payouts) {
        if (payout.fromUserId === "SYSTEM") {
          // SYSTEM payout - only credit the receiver (no debit needed)
          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        } else {
          // Regular payout - debit from payer and credit to receiver
          await this.debitUserWallet(
            tx,
            payout.fromUserId,
            payout.amount,
            transactionId,
            `Commission paid to ${payout.toUserId} for transaction ${transactionId}`,
            createdBy
          );

          await this.creditUserWallet(
            tx,
            payout.toUserId,
            payout.amount,
            transactionId,
            payout.narration,
            createdBy
          );
        }

        // Record commission earning - FIXED: Handle optional fromUserId properly
        const earningData: Prisma.CommissionEarningCreateInput = {
          user: { connect: { id: payout.toUserId } },
          service: { connect: { id: serviceId } },
          transactionId,
          amount: payout.amount,
          commissionAmount: payout.amount,
          commissionType: payout.commissionType,
          level: payout.level,
          createdByUser: { connect: { id: createdBy } },
          metadata: {
            grossAmount: Number(payout.amount) / 100,
            commissionValue: payout.commissionValue,
            narration: payout.narration,
            fromUserId: payout.fromUserId,
          } as Prisma.InputJsonValue,
        };

        // Add fromUserId only if it's not SYSTEM
        if (payout.fromUserId !== "SYSTEM") {
          earningData.fromUser = { connect: { id: payout.fromUserId } };
        }

        const earning = await tx.commissionEarning.create({
          data: earningData,
        });

        earnings.push(earning);

        logger.debug("Commission earning recorded", {
          transactionId,
          earningId: earning.id,
          from: payout.fromUserId,
          to: payout.toUserId,
          amount: Number(payout.amount) / 100,
        });
      }

      return earnings;
    });

    // Calculate total commission distributed from SYSTEM
    const totalSystemCommission = payouts
      .filter((p) => p.fromUserId === "SYSTEM")
      .reduce((sum, payout) => sum + payout.amount, BigInt(0));

    logger.info("Commission distribution completed successfully", {
      transactionId,
      distributedCount: createdEarnings.length,
      totalSystemCommission: Number(totalSystemCommission) / 100,
      payoutFlow: payouts.map(
        (p) => `${p.fromUserId} → ${p.toUserId} (₹${Number(p.amount) / 100})`
      ),
    });

    return createdEarnings;
  }

  /**
   * TEST METHOD - Verify corrected commission calculation
   */
  static testCommissionScenario() {
    const baseAmount = BigInt(10000); // ₹100 in paise
    const transactionId = "test-tx-123";

    // Your scenario: BBPS Provider → Super Admin (₹20) → Admin (₹15) → User (₹10)
    const testChain: CommissionChainMember[] = [
      {
        userId: "user1",
        roleId: "user-role",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 10,
        level: 1,
      },
      {
        userId: "admin1",
        roleId: "admin-role",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 15,
        level: 2,
      },
      {
        userId: "super1",
        roleId: "super-admin-role",
        commissionType: CommissionType.PERCENTAGE,
        commissionValue: 20,
        level: 3,
      },
    ];

    console.log("=== CORRECTED COMMISSION SCENARIO TEST ===");
    console.log("Base Amount: ₹", Number(baseAmount) / 100);
    console.log(
      "Chain (Bottom to Top):",
      testChain.map((m) => ({
        user: m.userId,
        commission: `${m.commissionValue}%`,
        level: m.level,
      }))
    );

    // Calculate hierarchical commissions
    const commissions = this.calculateHierarchicalCommissions(
      testChain,
      baseAmount
    );

    console.log("=== HIERARCHICAL COMMISSIONS ===");
    commissions.forEach((commission) => {
      console.log(
        `Level ${commission.level} (${commission.userId}): ₹${Number(commission.amount) / 100}`
      );
    });

    const payouts = this.calculateCommissionPayouts(commissions, transactionId);

    console.log("=== CORRECTED PAYOUT FLOW ===");
    payouts.forEach((payout) => {
      console.log(
        `${payout.fromUserId} → ${payout.toUserId}: ₹${Number(payout.amount) / 100}`
      );
    });

    // Calculate net earnings
    console.log("=== NET EARNINGS ===");
    const netEarnings = new Map<string, bigint>();

    payouts.forEach((payout) => {
      // Add credits
      if (!netEarnings.has(payout.toUserId)) {
        netEarnings.set(payout.toUserId, BigInt(0));
      }
      netEarnings.set(
        payout.toUserId,
        netEarnings.get(payout.toUserId)! + payout.amount
      );

      // Subtract debits (if not SYSTEM)
      if (payout.fromUserId !== "SYSTEM") {
        if (!netEarnings.has(payout.fromUserId)) {
          netEarnings.set(payout.fromUserId, BigInt(0));
        }
        netEarnings.set(
          payout.fromUserId,
          netEarnings.get(payout.fromUserId)! - payout.amount
        );
      }
    });

    netEarnings.forEach((amount, userId) => {
      console.log(`${userId}: ₹${Number(amount) / 100}`);
    });

    const totalDistributed = payouts
      .filter((p) => p.fromUserId === "SYSTEM")
      .reduce((sum, p) => sum + p.amount, BigInt(0));

    console.log(
      "Total Commission Distributed: ₹",
      Number(totalDistributed) / 100
    );

    return {
      commissions,
      payouts,
      netEarnings: Object.fromEntries(netEarnings),
    };
  }

  private static async creditUserWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: bigint,
    transactionId: string,
    narration: string,
    createdBy: string
  ): Promise<void> {
    // Use optimistic concurrency control
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, version: true },
    });

    if (!wallet) {
      throw ApiError.internal(`Wallet not found for user ${userId}`);
    }

    const currentBalance = BigInt(wallet.balance ?? 0);
    const newBalance = currentBalance + amount;

    // Atomic update with version check
    const updatedWallet = await tx.wallet.update({
      where: {
        id: wallet.id,
        version: wallet.version,
      },
      data: {
        balance: newBalance,
        version: { increment: 1 },
      },
    });

    if (!updatedWallet) {
      throw ApiError.internal(`Wallet update conflict for user ${userId}`);
    }

    // FIXED: Use proper Prisma types for ledger entry
    const ledgerData: Prisma.LedgerEntryCreateInput = {
      wallet: { connect: { id: wallet.id } },
      transaction: { connect: { id: transactionId } },
      entryType: LedgerEntryType.CREDIT,
      referenceType: ReferenceType.COMMISSION,
      amount: amount,
      runningBalance: newBalance,
      narration: narration,
      createdBy: createdBy,
    };

    await tx.ledgerEntry.create({
      data: ledgerData,
    });

    logger.debug("Wallet credited", {
      userId,
      amount: Number(amount) / 100,
      newBalance: Number(newBalance) / 100,
      transactionId,
    });
  }

  private static async debitUserWallet(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: bigint,
    transactionId: string,
    narration: string,
    createdBy: string
  ): Promise<void> {
    // Use optimistic concurrency control
    const wallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, version: true },
    });

    if (!wallet) {
      throw ApiError.internal(`Wallet not found for user ${userId}`);
    }

    const currentBalance = BigInt(wallet.balance ?? 0);
    if (currentBalance < amount) {
      throw ApiError.internal(
        `Insufficient funds in wallet ${userId} for commission payout. Balance: ₹${Number(currentBalance) / 100}, Required: ₹${Number(amount) / 100}`
      );
    }

    const newBalance = currentBalance - amount;

    // Atomic update with version check
    const updatedWallet = await tx.wallet.update({
      where: {
        id: wallet.id,
        version: wallet.version,
      },
      data: {
        balance: newBalance,
        version: { increment: 1 },
      },
    });

    if (!updatedWallet) {
      throw ApiError.internal(`Wallet update conflict for user ${userId}`);
    }

    // FIXED: Use proper Prisma types for ledger entry
    const ledgerData: Prisma.LedgerEntryCreateInput = {
      wallet: { connect: { id: wallet.id } },
      transaction: { connect: { id: transactionId } },
      entryType: LedgerEntryType.DEBIT,
      referenceType: ReferenceType.COMMISSION,
      amount: amount,
      runningBalance: newBalance,
      narration: narration,
      createdBy: createdBy,
    };

    await tx.ledgerEntry.create({
      data: ledgerData,
    });

    logger.debug("Wallet debited", {
      userId,
      amount: Number(amount) / 100,
      newBalance: Number(newBalance) / 100,
      transactionId,
    });
  }
}

export default CommissionDistributionService;
