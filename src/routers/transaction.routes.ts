import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { TransactionValidationSchemas } from "../validations/transactionValidation.schemas.js";
import { TransactionController } from "../controllers/transaction.controller.js";

const transactionRoutes = Router();

// ---------------- CREATE TRANSACTION ----------------
transactionRoutes.post(
  "/transaction",
  AuthMiddleware.isAuthenticated,
  validateRequest(TransactionValidationSchemas.createTransactionSchema),
  TransactionController.createTransaction
);

// ---------------- REFUND TRANSACTION ----------------
transactionRoutes.post(
  "/refund",
  AuthMiddleware.isAuthenticated,
  validateRequest(TransactionValidationSchemas.refundTransactionSchema),
  TransactionController.refundTransaction
);

// ---------------- GET TRANSACTIONS ----------------
transactionRoutes.post(
  "/",
  AuthMiddleware.isAuthenticated,
  validateRequest(TransactionValidationSchemas.getTransactionsSchema),
  TransactionController.getTransactions
);

// ---------------- UPDATE TRANSACTION STATUS ----------------
transactionRoutes.patch(
  "/transaction/status",
  AuthMiddleware.isAuthenticated,
  validateRequest(TransactionValidationSchemas.updateTransactionStatusSchema),
  TransactionController.updateTransactionStatus
);

export default transactionRoutes;
