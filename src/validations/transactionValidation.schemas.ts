import { z } from "zod";

export class TransactionValidationSchemas {
  static get createTransactionSchema() {
    return z.object({
      userId: z.string().uuid(),
      walletId: z.string().uuid(),
      serviceId: z.string().uuid(),
      providerId: z.string().uuid().optional(),
      amount: z.number().positive(),
      commissionAmount: z.number().nonnegative().default(0),
      idempotencyKey: z.string().optional(),
      referenceId: z.string().optional(),
      requestPayload: z.record(z.string(), z.any()).optional(),
    });
  }

  static get refundTransactionSchema() {
    return z.object({
      transactionId: z.string().uuid(),
      initiatedBy: z.string().uuid(),
      amount: z.number().positive(),
      reason: z.string().optional(),
    });
  }

  static get getTransactionsSchema() {
    return z.object({
      userId: z.string().uuid().optional(),
      status: z.string().optional(),
      serviceId: z.string().uuid().optional(),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
    });
  }

  static get updateTransactionStatusSchema() {
    return z.object({
      transactionId: z.string().uuid(),
      status: z.enum(["SUCCESS", "FAILED"]),
      responsePayload: z.record(z.string(), z.any()).optional(),
    });
  }
}
