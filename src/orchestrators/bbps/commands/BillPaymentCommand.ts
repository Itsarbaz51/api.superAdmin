// src/orchestrators/bbps/commands/BillPaymentCommand.ts
import { BaseCommand } from "./BaseCommand.js";
import {
  TxStatus,
  LedgerEntryType,
  ReferenceType,
  Prisma,
} from "@prisma/client";
import PrismaClient from "../../../db/db.js";
import { ApiError } from "../../../utils/ApiError.js";
import BBPService from "../../../services/bbps.service.js";
import { WalletService } from "../../../services/wallet.service.js";
import CommissionDistributionService from "../../../services/commission.distribution.service.js";
import logger from "../../../utils/WinstonLogger.js";

export class BillPaymentCommand extends BaseCommand {
  name = "BILL_PAYMENT";

  protected async validate(data: any): Promise<void> {
    if (!data.amount || data.amount <= 0) {
      throw ApiError.badRequest("Valid amount is required");
    }
    if (!data.billerId) {
      throw ApiError.badRequest("Biller ID is required");
    }
    if (!data.customerParams) {
      throw ApiError.badRequest("Customer parameters are required");
    }
    if (!data.userId) {
      throw ApiError.badRequest("User ID is required");
    }

    // Additional validation for BBPS specific fields
    if (!data.customerParams.consumerNumber) {
      throw ApiError.badRequest("Consumer number is required");
    }

    // Rate limiting check
    const recentTxCount = await PrismaClient.transaction.count({
      where: {
        userId: data.userId,
        serviceId: data.serviceId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last 1 hour
      },
    });

    if (recentTxCount > 100) {
      throw ApiError.badRequest(
        "Rate limit exceeded. Maximum 100 transactions per hour allowed."
      );
    }
  }

  protected async perform(data: any): Promise<any> {
    const {
      userId,
      serviceId,
      amount,
      billerId,
      customerParams,
      channel = "BBPS",
      idempotencyKey,
      createdBy,
    } = data;

    return await PrismaClient.$transaction(
      async (tx) => {
        // 1. Check idempotency first
        if (idempotencyKey) {
          const existingTransaction = await tx.transaction.findFirst({
            where: { idempotencyKey },
          });

          if (existingTransaction) {
            logger.info("Duplicate transaction prevented by idempotency key", {
              idempotencyKey,
              transactionId: existingTransaction.id,
            });
            return {
              success: true,
              transaction: existingTransaction,
              isDuplicate: true,
              message: "Transaction already processed",
            };
          }
        }

        // 2. Validate user and wallet with balance check
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            wallets: { where: { isPrimary: true } },
            role: true,
          },
        });

        if (!user) throw ApiError.notFound("User not found");
        if (user.status !== "ACTIVE") {
          throw ApiError.forbidden("User account is not active");
        }

        const wallet = user.wallets[0];
        if (!wallet) throw ApiError.badRequest("Primary wallet not found");

        const amountInPaise = BigInt(Math.round(amount * 100));

        // Check wallet balance before proceeding
        if (wallet.balance < amountInPaise) {
          throw ApiError.badRequest(
            `Insufficient wallet balance. Available: ₹${Number(wallet.balance) / 100}, Required: ₹${amount}`
          );
        }

        // 3. Validate bill with BBPS provider
        const billValidation = await BBPService.validateBill({
          billerId,
          customerParams,
          amount: amountInPaise,
        });

        if (!billValidation.isValid) {
          throw ApiError.badRequest(
            `Bill validation failed: ${billValidation.error}`
          );
        }

        // 4. Create main transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            serviceId,
            amount: amountInPaise,
            providerCharge: BigInt(0),
            commissionAmount: BigInt(0),
            netAmount: amountInPaise,
            status: TxStatus.PENDING,
            idempotencyKey,
            requestPayload: {
              billerId,
              customerParams,
              channel,
              billValidation: billValidation.billDetails,
              userRole: user.role?.name,
            } as Prisma.InputJsonValue,
          },
        });

        try {
          // 5. Create BBPS transaction record - FIXED: Handle optional fields properly
          const bbpsTransactionData: Prisma.BBPSTransactionCreateInput = {
            transaction: { connect: { id: transaction.id } },
            biller: { connect: { id: billerId } },
            consumerNumber: customerParams.consumerNumber,
            consumerName: customerParams.consumerName || null,
            billAmount: amount,
            dueAmount: amount,
            billDate: new Date(),
            billStatus: "PENDING",
            additionalParams: customerParams as Prisma.InputJsonValue,
            validationResponse:
              billValidation as unknown as Prisma.InputJsonValue,
          };

          // FIXED: Handle dueDate properly - convert undefined to null
          if (billValidation.billDetails?.dueDate) {
            bbpsTransactionData.dueDate = new Date(
              billValidation.billDetails.dueDate
            );
          } else {
            bbpsTransactionData.dueDate = null; // Explicitly set to null instead of undefined
          }

          // FIXED: Handle optional fields
          if (customerParams.billNumber) {
            bbpsTransactionData.billNumber = customerParams.billNumber;
          }

          if (customerParams.billPeriod) {
            bbpsTransactionData.billPeriod = customerParams.billPeriod;
          }

          const bbpsTransaction = await tx.bBPSTransaction.create({
            data: bbpsTransactionData,
          });

          // 6. Debit wallet with proper error handling
          await WalletService.debitWallet(
            wallet.id,
            amountInPaise,
            `BBPS payment for biller ${billerId} - Consumer: ${customerParams.consumerNumber}`,
            createdBy || userId,
            idempotencyKey,
            transaction.id
          );

          // 7. Process payment with BBPS provider
          const paymentResult = await BBPService.processPayment({
            transactionId: transaction.id,
            billerId,
            amount: amountInPaise,
            customerParams,
            mobileNumber: user.phoneNumber,
            email: user.email,
          });

          // 8. Update BBPS transaction with payment result
          if (paymentResult.success && paymentResult.externalRefId) {
            await tx.bBPSTransaction.update({
              where: { id: bbpsTransaction.id },
              data: {
                bbpsTxnId: paymentResult.externalRefId,
                paymentResponse:
                  paymentResult.response as Prisma.InputJsonValue,
                billStatus: "PAID",
              },
            });
          }

          // 9. Update main transaction status - FIXED: Handle optional fields properly
          const updateData: Prisma.TransactionUpdateInput = {
            status: paymentResult.success ? TxStatus.SUCCESS : TxStatus.FAILED,
            providerCharge: paymentResult.providerCharge,
            responsePayload: paymentResult.response as Prisma.InputJsonValue,
            completedAt: new Date(),
          };

          // Add optional fields only if they exist
          if (paymentResult.externalRefId) {
            updateData.externalRefId = paymentResult.externalRefId;
          }
          if (paymentResult.errorCode) {
            updateData.errorCode = paymentResult.errorCode;
          }
          if (paymentResult.errorMessage) {
            updateData.errorMessage = paymentResult.errorMessage;
          }

          const updatedTransaction = await tx.transaction.update({
            where: { id: transaction.id },
            data: updateData,
          });

          if (paymentResult.success) {
            // 10. Distribute commissions using CORRECTED logic
            try {
              await CommissionDistributionService.distribute(
                {
                  id: transaction.id,
                  userId,
                  serviceId,
                  amount: amountInPaise,
                  providerCharge: paymentResult.providerCharge,
                  channel,
                },
                createdBy || userId
              );

              // 11. Update commission amounts in transaction
              const commissionEarnings = await tx.commissionEarning.aggregate({
                where: { transactionId: transaction.id },
                _sum: { commissionAmount: true },
              });

              const totalCommission =
                commissionEarnings._sum.commissionAmount || BigInt(0);

              await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                  commissionAmount: totalCommission,
                  netAmount: amountInPaise - totalCommission,
                },
              });

              logger.info(
                "BBPS payment and commission distribution completed",
                {
                  transactionId: transaction.id,
                  bbpsTxnId: paymentResult.externalRefId,
                  totalCommission: Number(totalCommission) / 100,
                  netAmount: Number(amountInPaise - totalCommission) / 100,
                }
              );
            } catch (commissionError: unknown) {
              // FIXED: Proper error type handling
              const errorMessage =
                commissionError instanceof Error
                  ? commissionError.message
                  : "Unknown commission distribution error";

              logger.error("Commission distribution failed", {
                transactionId: transaction.id,
                error: errorMessage,
              });
              // Don't fail the transaction if commission distribution fails
              // Just log the error and continue
            }

            return {
              success: true,
              transaction: updatedTransaction,
              bbpsTransaction: {
                ...bbpsTransaction,
                bbpsTxnId: paymentResult.externalRefId,
              },
              providerResponse: paymentResult.response,
              message: "Bill payment processed successfully",
            };
          } else {
            // 12. Handle failed payment - refund wallet
            await this.refundFailedTransaction(
              tx,
              transaction.id,
              wallet.id,
              amountInPaise,
              createdBy || userId,
              `Refund for failed BBPS payment: ${paymentResult.errorMessage}`
            );

            await tx.bBPSTransaction.update({
              where: { id: bbpsTransaction.id },
              data: {
                billStatus: "FAILED",
                paymentResponse:
                  paymentResult.response as Prisma.InputJsonValue,
              },
            });

            return {
              success: false,
              transaction: updatedTransaction,
              bbpsTransaction,
              providerResponse: paymentResult.response,
              error: paymentResult.errorMessage,
              message: "Bill payment failed",
            };
          }
        } catch (error: unknown) {
          // 13. Handle any processing errors - refund wallet
          const errorMessage =
            error instanceof Error ? error.message : "Unknown processing error";

          await this.refundFailedTransaction(
            tx,
            transaction.id,
            wallet.id,
            amountInPaise,
            createdBy || userId,
            `Refund for processing error: ${errorMessage}`
          );

          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              status: TxStatus.FAILED,
              errorCode: "PROCESSING_ERROR",
              errorMessage: errorMessage,
              completedAt: new Date(),
            },
          });

          throw error;
        }
      },
      {
        maxWait: 10000, // 10 seconds max wait for transaction
        timeout: 30000, // 30 seconds timeout
      }
    );
  }

  private async refundFailedTransaction(
    tx: Prisma.TransactionClient,
    transactionId: string,
    walletId: string,
    amount: bigint,
    createdBy: string,
    reason: string
  ): Promise<void> {
    try {
      await WalletService.creditWallet(
        walletId,
        amount,
        reason,
        createdBy,
        undefined,
        transactionId
      );

      logger.info("Transaction refund processed", {
        transactionId,
        amount: Number(amount) / 100,
        reason,
      });
    } catch (refundError: unknown) {
      // FIXED: Proper error type handling
      const errorMessage =
        refundError instanceof Error
          ? refundError.message
          : "Unknown refund error";

      logger.error("Failed to process refund", {
        transactionId,
        error: errorMessage,
        amount: Number(amount) / 100,
      });
      // Don't throw here - we don't want refund failure to hide the original error
    }
  }
}
