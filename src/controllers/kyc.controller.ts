import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import KycValidationSchemas from "../validations/kycValidation.schemas.js";
import KycServices from "../services/kyc.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class UserKycController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const validatedData = await KycValidationSchemas.UserKyc.parseAsync(
      req.body
    );

    // Store KYC
    const dbStoreData = await KycServices.storeUserKyc(validatedData);

    // Send structured API response
    return res
      .status(201)
      .json(
        ApiResponse.success(dbStoreData, "User KYC created successfully", 201)
      );
  });
}

class BusinessKycController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {});
  static update = asyncHandler(async (req: Request, res: Response) => {});
  static destroy = asyncHandler(async (req: Request, res: Response) => {});
  static businessKycVerification = asyncHandler(
    async (req: Request, res: Response) => {}
  );
}

export default { UserKycController, BusinessKycController };
