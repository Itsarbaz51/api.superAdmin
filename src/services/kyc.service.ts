import Prisma from "../db/db.js";
import type { UserKyc, UserKycInput, Gender } from "../types/kyc.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";

class KycServices {
  static async storeUserKyc(payload: UserKycInput): Promise<UserKyc> {
    const existingKyc = await Prisma.userKyc.findFirst({
      where: { userId: payload.userId },
    });

    if (existingKyc) {
      throw ApiError.badRequest("Invalid payload", [
        "KYC already exists for this user",
      ]);
    }

    // Upload files to S3
    const panUrl = await S3Service.upload(payload.panFile, "user-kyc");
    const aadhaarUrl = await S3Service.upload(payload.aadhaarFile, "user-kyc");
    const addressProofUrl = await S3Service.upload(
      payload.addressProofFile,
      "user-kyc"
    );

    if (!panUrl || !aadhaarUrl || !addressProofUrl) {
      throw ApiError.internal("File Upload Failed", [
        "Failed to upload one or more KYC documents.",
      ]);
    }

    // Replace payload file paths with uploaded URLs
    const newPayload: UserKycInput = {
      ...payload,
      panFile: panUrl,
      aadhaarFile: aadhaarUrl,
      addressProofFile: addressProofUrl,
    };

    const createdKyc = await Prisma.userKyc.create({
      data: newPayload,
      include: {
        address: true,
        businessKyc: true,
      },
    });

    if (!createdKyc) {
      throw ApiError.internal("Internal Server Error", [
        "Failed to create KYC record. Please try again later.",
      ]);
    }

    return {
      ...createdKyc,
      gender: createdKyc.gender as Gender,
    };
  }
}

export default KycServices;
