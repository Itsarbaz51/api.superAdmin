import Prisma from "../db/db.js";
import type { UserKyc, UserKycInput, Gender, UserKycUploadInput, BusinessKycInput, BusinessKyc, BusinessKycUploadInput, BusinessType } from "../types/kyc.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";

class KycServices {
  static async showUserKyc(userId: string, id: string): Promise<UserKyc> {
    const userExsits = await Prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
      },
    })

    if (!userExsits) {
      throw ApiError.notFound("User not found")
    }

    const kyc = await Prisma.userKyc.findFirst({
      where: { id, userId: userExsits.id },
    });

    if (!kyc) {
      throw ApiError.notFound("KYC not found");
    }

    return {
      ...kyc,
      gender: kyc.gender as Gender,
    };
  }
  static async storeUserKyc(payload: UserKycUploadInput): Promise<UserKyc> {

    const userExsits = await Prisma.user.findFirst({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
      },
    })

    if (!userExsits) {
      throw ApiError.badRequest("User not found");
    }

    const existingKyc = await Prisma.userKyc.findFirst({
      where: { userId: payload.userId },
    });

    if (existingKyc) {
      throw ApiError.badRequest("KYC already exists for this user");
    }


    const addressExsits = await Prisma.address.findFirst({
      where: {
        id: payload.addressId,
      },
      select: {
        id: true,
      },
    })

    if (!addressExsits) {
      throw ApiError.badRequest("Address not found");
    }

    const businessKycExsits = await Prisma.businessKyc.findFirst({
      where: {
        id: payload.businessKycId,
      },
      select: {
        id: true,
      },

    })

    if (!businessKycExsits) {
      throw ApiError.badRequest("Business KYC not found");
    }



    // Upload files to S3
    const panUrl = await S3Service.upload(payload.panFile.path, "user-kyc");
    const photoUrl = await S3Service.upload(payload.photo.path, "user-kyc");
    const aadhaarUrl = await S3Service.upload(payload.aadhaarFile.path, "user-kyc");
    const addressProofUrl = await S3Service.upload(payload.addressProofFile.path, "user-kyc");

    if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
      throw ApiError.internal("Failed to upload one or more user KYC documents");
    }

    const newPayload: UserKycInput = {
      ...payload,
      dob: new Date(payload.dob.toString().trim()),
      panNumber: payload.panNumber.toUpperCase(),
      addressId: addressExsits.id,
      userId: userExsits.id,
      photo: photoUrl,
      panFile: panUrl,
      aadhaarFile: aadhaarUrl,
      addressProofFile: addressProofUrl,
    };


    const createdKyc = await Prisma.userKyc.create({
      data: newPayload,
    });

    return {
      ...createdKyc,
      gender: createdKyc.gender as Gender,
    };
  }
  static async storeBusinessKyc(payload: BusinessKycUploadInput): Promise<BusinessKyc> {
    const userExists = await Prisma.user.findFirst({
      where: { id: payload.userId },
      select: { id: true },
    });

    if (!userExists) throw ApiError.badRequest("User not found");

    const existingKyc = await Prisma.businessKyc.findFirst({ where: { userId: userExists.id } });
    if (existingKyc) throw ApiError.badRequest("KYC already exists for this user");

    const addressExists = await Prisma.address.findFirst({
      where: { id: payload.addressId },
      select: { id: true },
    });
    if (!addressExists) throw ApiError.badRequest("Address not found");

    const panUrl = await S3Service.upload(payload.panFile.path, "business-kyc");
    const gstUrl = await S3Service.upload(payload.gstFile.path, "business-kyc");
    const aoaUrl = payload.aoaFile ? await S3Service.upload(payload.aoaFile.path, "business-kyc") : null;
    const brDocUrl = payload.brDoc ? await S3Service.upload(payload.brDoc.path, "business-kyc") : null;
    const directorShareholdingUrl = payload.directorShareholding
      ? await S3Service.upload(payload.directorShareholding.path, "business-kyc")
      : null;
    const moaUrl = payload.moaFile ? await S3Service.upload(payload.moaFile.path, "business-kyc") : null;
    const partnershipDeedUrl = payload.partnershipDeed
      ? await S3Service.upload(payload.partnershipDeed.path, "business-kyc")
      : null;

    if (!panUrl || !gstUrl) {
      throw ApiError.internal("Failed to upload required files");
    }

    const newPayload: BusinessKycInput = {
      ...payload,
      panNumber: payload.panNumber.toUpperCase(),
      addressId: addressExists.id,
      userId: userExists.id,
      panFile: panUrl,
      gstFile: gstUrl,
      brDoc: brDocUrl,
      partnershipDeed: partnershipDeedUrl,
      moaFile: moaUrl,
      aoaFile: aoaUrl,
      directorShareholding: directorShareholdingUrl,
    };

    const createdKyc = await Prisma.businessKyc.create({ data: newPayload });

    return { ...createdKyc, businessType: createdKyc.businessType as BusinessType };
  }
}

export default KycServices;
