import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { UserKycController } from "../controllers/kyc.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import KycValidationSchemas from "../validations/kycValidation.schemas.js";
import upload from "../middlewares/multer.middleware.js";

const kycRoutes = Router();

// kycRoutes.get("");
kycRoutes.post(
  "/user-kyc-store",
  AuthMiddleware.isAuthenticated,
  validateRequest(KycValidationSchemas.UserKyc),
  upload.fields([
    { name: "panFile", maxCount: 1 },
    { name: "aadhaarFile", maxCount: 1 },
    { name: "addressProofFile", maxCount: 1 },
  ]),
  UserKycController.store
);
// kycRoutes.put("");
// kycRoutes.delete("");

export default kycRoutes;
