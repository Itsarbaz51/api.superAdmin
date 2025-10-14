import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import KycServices from "../services/kyc.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  BusinessKycUploadInput,
  FilterParams,
  UserKycUploadInput,
} from "../types/kyc.types.js";

class UserKycController {
  static index = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.internal("User ID not found in request");
    }

    const { status, page = 1, limit = 10, sort = "desc" } = req.body;

    const allKyc = await KycServices.indexUserKyc({
      userId,
      status,
      page,
      limit,
      sort,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(allKyc, "User KYC list fetched successfully", 200)
      );
  });
  static show = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("KYC ID is required");
    }

    const kycData = await KycServices.showUserKyc(userId, id);

    return res
      .status(200)
      .json(ApiResponse.success(kycData, "User KYC fetched successfully", 201));
  });
  static store = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const files = req.files as {
      panFile?: Express.Multer.File[];
      aadhaarFile?: Express.Multer.File[];
      addressProofFile?: Express.Multer.File[];
      photo?: Express.Multer.File[];
    };

    const panFile = files.panFile?.[0];
    const aadhaarFile = files.aadhaarFile?.[0];
    const addressProofFile = files.addressProofFile?.[0];
    const photo = files.photo?.[0];

    if (!panFile || !aadhaarFile || !addressProofFile || !photo) {
      throw ApiError.badRequest(
        "All KYC files are required (PAN, Aadhaar, Address Proof, Photo)."
      );
    }

    const dbStoreData = await KycServices.storeUserKyc({
      ...req.body,
      panFile,
      aadhaarFile,
      addressProofFile,
      photo,
      userId,
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          dbStoreData,
          "User KYC submitted, waiting for approval",
          201
        )
      );
  });
  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params; // KYC record ID to update
    if (!id) throw ApiError.badRequest("KYC ID is required in params");

    const files = req.files as {
      panFile?: Express.Multer.File[];
      aadhaarFile?: Express.Multer.File[];
      addressProofFile?: Express.Multer.File[];
      photo?: Express.Multer.File[];
    };

    const panFile = files.panFile?.[0];
    const aadhaarFile = files.aadhaarFile?.[0];
    const addressProofFile = files.addressProofFile?.[0];
    const photo = files.photo?.[0];

    // Partial update — files are optional
    const updateData: any = {
      ...req.body,
      userId,
    };

    if (panFile) updateData.panFile = panFile;
    if (aadhaarFile) updateData.aadhaarFile = aadhaarFile;
    if (addressProofFile) updateData.addressProofFile = addressProofFile;
    if (photo) updateData.photo = photo;

    const dbUpdateData = await KycServices.updateUserKyc(id, updateData);

    return res
      .status(200)
      .json(
        ApiResponse.success(dbUpdateData, "User KYC updated successfully", 200)
      );
  });
  static verification = asyncHandler(async (req: Request, res: Response) => {
    const dbStoreData = await KycServices.verifyUserKyc(req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(dbStoreData, "User KYC verified successfully", 200)
      );
  });
}

class BusinessKycController {
  static index = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.internal("User ID not found in request");
    }

    const { status, page = 1, limit = 10, sort = "desc" } = req.body;

    const allKyc = await KycServices.indexBusinessKyc({
      userId,
      status,
      page,
      limit,
      sort,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(
          allKyc,
          "Business KYC list fetched successfully",
          200
        )
      );
  });
  static show = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { id } = req.params;
    if (!id) {
      throw ApiError.badRequest("KYC ID is required");
    }

    const kycData = await KycServices.showBusinessKyc(userId, id);

    return res
      .status(200)
      .json(
        ApiResponse.success(kycData, "Business KYC fetched successfully", 201)
      );
  });
  static store = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const files = req.files as { [key: string]: Express.Multer.File[] };
    const getFile = (name: string) => files?.[name]?.[0] || null;

    const panFile = getFile("panFile");
    const gstFile = getFile("gstFile");
    const brDoc = getFile("brDoc");
    const partnershipDeed = getFile("partnershipDeed");
    const moaFile = getFile("moaFile");
    const aoaFile = getFile("aoaFile");
    const directorShareholding = getFile("directorShareholding");

    if (!panFile || !gstFile)
      throw ApiError.badRequest("PAN and GST files are required");

    const dbStoreData = await KycServices.storeBusinessKyc({
      ...req.body,
      userId,
      panFile,
      gstFile,
      brDoc,
      partnershipDeed,
      moaFile,
      aoaFile,
      directorShareholding,
    } as BusinessKycUploadInput);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          dbStoreData,
          "Business KYC submitted, waiting for approval",
          201
        )
      );
  });
  static update = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.internal("User ID not found in request");

    const { businessKycId } = req.body;
    if (!businessKycId)
      throw ApiError.badRequest("Business KYC ID is required");

    const files = req.files as {
      panFile?: Express.Multer.File[];
      gstFile?: Express.Multer.File[];
      brDoc?: Express.Multer.File[];
      partnershipDeed?: Express.Multer.File[];
      moaFile?: Express.Multer.File[];
      aoaFile?: Express.Multer.File[];
      directorShareholding?: Express.Multer.File[];
    };

    // Get individual files (optional uploads)
    const panFile = files?.panFile?.[0];
    const gstFile = files?.gstFile?.[0];
    const brDoc = files?.brDoc?.[0];
    const partnershipDeed = files?.partnershipDeed?.[0];
    const moaFile = files?.moaFile?.[0];
    const aoaFile = files?.aoaFile?.[0];
    const directorShareholding = files?.directorShareholding?.[0];

    // Prepare update data
    const updateData: any = {
      ...req.body,
      userId,
      panFile,
      gstFile,
      brDoc,
      partnershipDeed,
      moaFile,
      aoaFile,
      directorShareholding,
      partnerKycNumbers: req.body.partnerKycNumbers
        ? JSON.parse(req.body.partnerKycNumbers)
        : undefined,
      directorKycNumbers: req.body.directorKycNumbers
        ? JSON.parse(req.body.directorKycNumbers)
        : undefined,
    };

    // Call service
    const updatedKyc = await KycServices.updateBusinessKyc(updateData);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          updatedKyc,
          "Business KYC updated successfully",
          200
        )
      );
  });

  static verification = asyncHandler(async (req: Request, res: Response) => {
    const dbStoreData = await KycServices.verifyBusinessKyc(req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          dbStoreData,
          "Business KYC verified successfully",
          200
        )
      );
  });
}

export { UserKycController, BusinessKycController };
