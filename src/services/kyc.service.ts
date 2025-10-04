import Prisma from "../db/db.js";
import type { UserKyc, UserKycInput, Gender, UserKycUploadInput } from "../types/kyc.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";

class KycServices {
  static async storeUserKyc(payload: UserKycUploadInput): Promise<UserKyc> {
    const existingKyc = await Prisma.userKyc.findFirst({
      where: { userId: payload.userId },
    });

    if (existingKyc) {
      throw ApiError.badRequest("KYC already exists for this user");
    }

    // Convert File objects to local file paths before uploading
    const panPath = (payload.panFile as any).path;
    const photoPath = (payload.photo as any).path;
    const aadhaarPath = (payload.aadhaarFile as any).path;
    const addressProofPath = (payload.addressProofFile as any).path;

    const panUrl = await S3Service.upload(panPath, "user-kyc");
    const photoUrl = await S3Service.upload(photoPath, "user-kyc");
    const aadhaarUrl = await S3Service.upload(aadhaarPath, "user-kyc");
    const addressProofUrl = await S3Service.upload(addressProofPath, "user-kyc");

    if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
      throw ApiError.internal("Failed to upload one or more KYC documents");
    }

    // Convert to DB payload (with URLs)
    const newPayload: UserKycInput = {
      ...payload,
      photo: photoUrl,
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

    return {
      ...createdKyc,
      gender: createdKyc.gender as Gender,
    };
  }
}

export default KycServices;
