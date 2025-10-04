import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import KycValidationSchemas from "../validations/kycValidation.schemas.js";
import KycServices from "../services/kyc.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

class UserKycController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {
    // Validate request body

    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.internal("User ID not found in request");
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const panFile = files?.panFile?.[0];
    const aadhaarFile = files?.aadhaarFile?.[0];
    const addressProofFile = files?.addressProofFile?.[0];
    const photo = files?.photo?.[0];

    if (!panFile || !aadhaarFile || !addressProofFile || !photo) {
      throw ApiError.badRequest(
        "All KYC files (PAN, Aadhaar, Address Proof) are required."
      );
    }

    // Store KYC
    const dbStoreData = await KycServices.storeUserKyc({
      ...req.body,
      userId,
      panFile,
      aadhaarFile,
      addressProofFile,
    });

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

export { UserKycController, BusinessKycController };
