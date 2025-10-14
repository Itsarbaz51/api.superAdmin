import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import {
  BusinessKycController,
  UserKycController,
} from "../controllers/kyc.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import KycValidationSchemas from "../validations/kycValidation.schemas.js";
import upload from "../middlewares/multer.middleware.js";

const kycRoutes = Router();

// users kyc routes
kycRoutes.post(
  "/user-list",
  AuthMiddleware.isAuthenticated,
  validateRequest(KycValidationSchemas.ListkycSchema),
  UserKycController.index
);
kycRoutes.get(
  "/user-kyc-show/:id",
  AuthMiddleware.isAuthenticated,
  UserKycController.show
);
kycRoutes.post(
  "/user-kyc-store",
  AuthMiddleware.isAuthenticated,
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  validateRequest(KycValidationSchemas.UserKyc),
  UserKycController.store
);
kycRoutes.put(
  "/user-verify",
  AuthMiddleware.isAuthenticated,
  validateRequest(KycValidationSchemas.VerificationKycSchema),
  UserKycController.verification
);
kycRoutes.put(
  "/user-kyc-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  UserKycController.update
);

// business kyc routes
kycRoutes.post(
  "/business-list",
  AuthMiddleware.isAuthenticated,
  validateRequest(KycValidationSchemas.ListkycSchema),
  BusinessKycController.index
);
kycRoutes.get(
  "/business-kyc-show/:id",
  AuthMiddleware.isAuthenticated,
  UserKycController.show
);
kycRoutes.post(
  "/business-kyc-store",
  AuthMiddleware.isAuthenticated,
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "gstFile", maxCount: 1 },
    { name: "brDoc", maxCount: 1 },
    { name: "partnershipDeed", maxCount: 1 },
    { name: "moaFile", maxCount: 1 },
    { name: "aoaFile", maxCount: 1 },
    { name: "directorShareholding", maxCount: 1 },
  ]),
  validateRequest(KycValidationSchemas.BusinessKycSchema),
  BusinessKycController.store
);
kycRoutes.put(
  "/business-verify",
  AuthMiddleware.isAuthenticated,
  validateRequest(KycValidationSchemas.VerificationKycSchema),
  BusinessKycController.verification
);
kycRoutes.put(
  "/business-kyc-update/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoles(["ADMIN", "SUPER ADMIN"]),
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "gstFile", maxCount: 1 },
    { name: "brDoc", maxCount: 1 },
    { name: "partnershipDeed", maxCount: 1 },
    { name: "moaFile", maxCount: 1 },
    { name: "aoaFile", maxCount: 1 },
    { name: "directorShareholding", maxCount: 1 },
  ]),
  BusinessKycController.update
);
export default kycRoutes;
