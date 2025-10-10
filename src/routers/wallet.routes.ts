import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { WalletController } from "../controllers/wallet.controller.js";
import WallletValidationSchemas from "../validations/walletValidation.schemas.js";

const walletRoutes = Router();

walletRoutes.post(
  "/wallet/credit",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(WallletValidationSchemas.walletCreditSchema),
  WalletController.creditWallet
);

walletRoutes.post(
  "/wallet/debit",

  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  validateRequest(WallletValidationSchemas.walletDebitSchema),

  WalletController.debitWallet
);

walletRoutes.get(
  "/wallet/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["SUPER ADMIN"]),
  WalletController.getWallet
);

export default walletRoutes;
