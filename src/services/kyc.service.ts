import Prisma from "../db/db.js";
import { KycStatus as PrismaKycStatus } from "@prisma/client";

import type {
  UserKyc,
  Gender,
  UserKycUploadInput,
  BusinessKyc,
  BusinessKycUploadInput,
  BusinessType,
  KycVerificationInput,
  FilterParams,
} from "../types/kyc.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";
import Helper from "../utils/helper.js";

class KycServices {
  // users kyc
  static async indexUserKyc(params: FilterParams) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        children: { select: { id: true } },
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    if (!["ADMIN", "SUPER ADMIN"].includes(user.role.name.toUpperCase()))
      throw ApiError.forbidden("Access denied: insufficient permissions");

    const childUserIds = user.children.map((child) => child.id);
    if (childUserIds.length === 0)
      return {
        data: [],
        meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };

    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: { in: childUserIds } };
    if (status && status.toUpperCase() !== "ALL") {
      where.status = status.toUpperCase(); // Only VERIFIED|REJECTED|PENDING
    }

    const kycs = await Prisma.userKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: { user: true, address: true },
    });

    const total = await Prisma.userKyc.count({ where });

    return {
      data: kycs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async showUserKyc(userId: string, id: string): Promise<UserKyc> {
    const userExsits = await Prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!userExsits) {
      throw ApiError.notFound("User not found");
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
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!userExists) {
        throw ApiError.notFound("User not found");
      }

      const existingKyc = await Prisma.userKyc.findFirst({
        where: { userId: payload.userId },
      });

      if (existingKyc) {
        throw ApiError.conflict("KYC already exists for this user");
      }

      const addressExists = await Prisma.address.findUnique({
        where: { id: payload.addressId },
        select: { id: true },
      });

      if (!addressExists) {
        throw ApiError.notFound("Address not found");
      }

      const businessKycExists = await Prisma.businessKyc.findUnique({
        where: { id: payload.businessKycId },
        select: { id: true },
      });

      if (!businessKycExists) {
        throw ApiError.notFound("Business KYC not found");
      }

      // Upload files
      const panUrl = await S3Service.upload(payload.panFile.path, "user-kyc");
      const photoUrl = await S3Service.upload(payload.photo.path, "user-kyc");
      const aadhaarUrl = await S3Service.upload(
        payload.aadhaarFile.path,
        "user-kyc"
      );
      const addressProofUrl = await S3Service.upload(
        payload.addressProofFile.path,
        "user-kyc"
      );

      if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
        throw ApiError.internal("Failed to upload one or more KYC documents");
      }

      const createdKyc = await Prisma.userKyc.create({
        data: {
          userId: payload.userId,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          fatherName: payload.fatherName.trim(),
          dob: new Date(payload.dob),
          gender: payload.gender,
          addressId: addressExists.id,
          panFile: panUrl,
          aadhaarFile: aadhaarUrl,
          addressProofFile: addressProofUrl,
          photo: photoUrl,
          businessKycId: businessKycExists.id,
        },
      });

      if (!createdKyc) {
        throw ApiError.internal("Failed to create user kyc");
      }

      // Create PII consents
      const createdPii = await Prisma.piiConsent.createMany({
        data: [
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            businessKycId: payload.businessKycId,
            piiType: "PAN",
            piiHash: Helper.hashData(payload.panNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5), // 1 year
            scope: "KYC_VERIFICATION",
          },
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            businessKycId: payload.businessKycId,
            piiType: "AADHAAR",
            piiHash: Helper.hashData(payload.aadhaarNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5),
            scope: "KYC_VERIFICATION",
          },
        ],
      });

      if (!createdPii) {
        throw ApiError.internal("Failed to create user kyc Pii");
      }

      return {
        ...createdKyc,
        gender: createdKyc.gender as Gender,
      };
    } catch (error) {
      console.error("storeBusinessKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async updateUserKyc(
    id: string,
    payload: Partial<UserKycUploadInput>
  ): Promise<UserKyc> {
    try {
      const existingKyc = await Prisma.userKyc.findUnique({ where: { id } });
      if (!existingKyc) throw ApiError.notFound("User KYC not found");

      const updates: any = {};

      if (payload.firstName) updates.firstName = payload.firstName.trim();
      if (payload.lastName) updates.lastName = payload.lastName.trim();
      if (payload.fatherName) updates.fatherName = payload.fatherName.trim();
      if (payload.gender) updates.gender = payload.gender;
      if (payload.dob) updates.dob = new Date(payload.dob);

      const uploadTasks: Promise<string | null>[] = [];
      const fileFields: [keyof typeof payload, keyof typeof existingKyc][] = [
        ["panFile", "panFile"],
        ["photo", "photo"],
        ["aadhaarFile", "aadhaarFile"],
        ["addressProofFile", "addressProofFile"],
      ];

      for (const [fileField, dbField] of fileFields) {
        const file = payload[fileField] as any; // safely cast
        if (file && typeof file === "object" && "path" in file) {
          uploadTasks.push(
            (async () => {
              const newUrl = await S3Service.upload(
                (file as any).path,
                "user-kyc"
              );
              if (newUrl) {
                const oldUrl = existingKyc[dbField] as string | null;
                if (oldUrl) {
                  await S3Service.delete({ fileUrl: oldUrl });
                }
                updates[dbField] = newUrl;
              }
              return newUrl;
            })()
          );
        }
      }

      if (uploadTasks.length > 0) await Promise.all(uploadTasks);

      const updatedKyc = await Prisma.userKyc.update({
        where: { id },
        data: updates,
      });

      if (!updatedKyc) {
        throw ApiError.internal("Failed to update user kyc");
      }

      return {
        ...updatedKyc,
        gender: updatedKyc.gender as Gender,
      };
    } catch (error) {
      console.error("storeBusinessKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async verifyUserKyc(
    payload: KycVerificationInput
  ): Promise<BusinessKyc> {
    const existingKyc = await Prisma.userKyc.findFirst({
      where: { id: payload.id },
    });

    if (!existingKyc) {
      throw ApiError.notFound("KYC not found");
    }

    const enumStatus =
      PrismaKycStatus[payload.status as keyof typeof PrismaKycStatus];
    if (!enumStatus) {
      throw ApiError.badRequest("Invalid status value");
    }

    const businessKyc = await Prisma.businessKyc.findFirst({
      where: { id: existingKyc.businessKycId },
    });

    if (!businessKyc) {
      throw ApiError.notFound("Related Business KYC not found");
    }

    const updateVerify = await Prisma.userKyc.update({
      where: { id: existingKyc.id },
      data: {
        status: { set: enumStatus },
      },
    });

    if (!updateVerify) throw ApiError.internal("Failed to verifyed user kyc");

    return {
      ...businessKyc,
      businessType: businessKyc.businessType as BusinessType,
    };
  }

  // business kyc
  static async indexBusinessKyc(params: FilterParams) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
    } = params;

    // Ensure numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    // Fetch user and children
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        children: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (!["ADMIN", "SUPER ADMIN"].includes(user.role.name.toUpperCase())) {
      throw ApiError.forbidden("Access denied: insufficient permissions");
    }

    const childUserIds = user.children.map((child) => child.id);

    if (childUserIds.length === 0) {
      return {
        data: [],
        meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };
    }

    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: { in: childUserIds },
    };

    // Apply status filter only if not "ALL"
    if (status && status.toUpperCase() !== "ALL") {
      where.status = status.toUpperCase();
    }

    const kycs = await Prisma.businessKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: true,
        address: true,
      },
    });

    const total = await Prisma.businessKyc.count({ where });

    return {
      data: kycs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async showBusinessKyc(
    userId: string,
    id: string
  ): Promise<BusinessKyc> {
    const userExsits = await Prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!userExsits) {
      throw ApiError.notFound("User not found");
    }

    const kyc = await Prisma.businessKyc.findFirst({
      where: { id, userId: userExsits.id },
    });

    if (!kyc) {
      throw ApiError.notFound("Business KYC not found");
    }

    return {
      ...kyc,
      businessType: kyc.businessType as BusinessType,
    };
  }

  static async storeBusinessKyc(
    payload: BusinessKycUploadInput
  ): Promise<BusinessKyc> {
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!userExists) throw ApiError.badRequest("User not found");

      const existingKyc = await Prisma.businessKyc.findFirst({
        where: { userId: payload.userId },
      });

      if (existingKyc) {
        throw ApiError.badRequest("KYC already exists for this user");
      }

      const addressExists = await Prisma.address.findUnique({
        where: { id: payload.addressId },
        select: { id: true },
      });

      if (!addressExists) throw ApiError.badRequest("Address not found");

      const panUrl = await S3Service.upload(
        payload.panFile.path,
        "business-kyc"
      );

      const gstUrl = await S3Service.upload(
        payload.gstFile.path,
        "business-kyc"
      );

      if (!panUrl || !gstUrl) {
        throw ApiError.internal("Failed to upload PAN or GST file");
      }

      const optionalUploads = await Promise.all([
        payload.aoaFile
          ? S3Service.upload(payload.aoaFile.path, "business-kyc")
          : null,
        payload.brDoc
          ? S3Service.upload(payload.brDoc.path, "business-kyc")
          : null,
        payload.directorShareholding
          ? S3Service.upload(payload.directorShareholding.path, "business-kyc")
          : null,
        payload.moaFile
          ? S3Service.upload(payload.moaFile.path, "business-kyc")
          : null,
        payload.partnershipDeed
          ? S3Service.upload(payload.partnershipDeed.path, "business-kyc")
          : null,
      ]);

      const [
        aoaUrl,
        brDocUrl,
        directorShareholdingUrl,
        moaUrl,
        partnershipDeedUrl,
      ] = optionalUploads;

      const newPayload: any = {
        userId: payload.userId,
        businessName: payload.businessName,
        businessType: payload.businessType,
        addressId: addressExists.id,
        panFile: panUrl,
        gstFile: gstUrl,
        brDoc: brDocUrl,
        partnershipDeed: partnershipDeedUrl,
        moaFile: moaUrl,
        aoaFile: aoaUrl,
        directorShareholding: directorShareholdingUrl,
        udhyamAadhar: payload.udhyamAadhar,
        partnerKycNumbers: payload.partnerKycNumbers,
        cin: payload.cin,
        directorKycNumbers: payload.directorKycNumbers,
      };

      const createdKyc = await Prisma.businessKyc.create({
        data: newPayload,
      });

      if (!createdKyc) {
        throw ApiError.internal("Failed to create business kyc");
      }

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 5);

      const userKyc = await Prisma.userKyc.findFirst({
        where: { userId: payload.userId },
        select: { id: true },
      });

      const userKycId = userKyc?.id ?? null;

      const createPiiPAN_BUSINESS = await Prisma.piiConsent.create({
        data: {
          userId: payload.userId,
          userKycId: userKycId,
          businessKycId: createdKyc.id,
          piiType: "PAN_BUSINESS",
          piiHash: Helper.hashData(payload.panNumber.toLocaleUpperCase()),
          providedAt: new Date(),
          expiresAt,
          scope: "KYC_VERIFICATION",
        },
      });

      if (!createPiiPAN_BUSINESS) {
        throw ApiError.internal("Failed to create pii PAN business kyc");
      }

      const createPiiGST = await Prisma.piiConsent.create({
        data: {
          userId: payload.userId,
          userKycId: userKycId,
          businessKycId: createdKyc.id,
          piiType: "GST",
          piiHash: Helper.hashData(payload.gstNumber.toLocaleUpperCase()),
          providedAt: new Date(),
          expiresAt,
          scope: "KYC_VERIFICATION",
        },
      });

      if (!createPiiGST) {
        throw ApiError.internal("Failed to create pii GST business kyc");
      }

      return {
        ...createdKyc,
        panNumber: payload.panNumber,
        gstNumber: payload.gstNumber,
      } as BusinessKyc;
    } catch (error) {
      console.error("storeBusinessKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.aoaFile?.path,
        payload.brDoc?.path,
        payload.directorShareholding?.path,
        payload.moaFile?.path,
        payload.gstFile?.path,
        payload.partnershipDeed?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async updateBusinessKyc(
    payload: BusinessKycUploadInput & { id: string }
  ): Promise<BusinessKyc> {
    const uploadedFiles: string[] = [];

    try {
      // 1️⃣ Check user exists
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!userExists) throw ApiError.badRequest("User not found");

      // 2️⃣ Check existing KYC
      const existingKyc = await Prisma.businessKyc.findUnique({
        where: { id: payload.id },
      });
      if (!existingKyc)
        throw ApiError.badRequest("Business KYC record not found");
      if (existingKyc.userId !== payload.userId)
        throw ApiError.forbidden("You cannot update someone else's KYC");

      // 3️⃣ Helper to delete old S3 file and upload new one
      async function deleteAndUpload(
        newFile?: Express.Multer.File,
        existingFileUrl?: string | null
      ): Promise<string | null> {
        if (newFile) {
          uploadedFiles.push(newFile.path); // Track local file for deletion
          if (existingFileUrl) {
            await S3Service.delete({ fileUrl: existingFileUrl });
          }
          const uploadedUrl = await S3Service.upload(
            newFile.path,
            "business-kyc"
          );
          if (!uploadedUrl) throw ApiError.internal("File upload failed");
          return uploadedUrl;
        }
        return existingFileUrl || null;
      }

      // 4️⃣ Upload files if provided
      const panFile = await deleteAndUpload(
        payload.panFile,
        existingKyc.panFile
      );
      const gstFile = await deleteAndUpload(
        payload.gstFile,
        existingKyc.gstFile
      );
      const brDoc = await deleteAndUpload(payload.brDoc, existingKyc.brDoc);
      const partnershipDeed = await deleteAndUpload(
        payload.partnershipDeed,
        existingKyc.partnershipDeed
      );
      const moaFile = await deleteAndUpload(
        payload.moaFile,
        existingKyc.moaFile
      );
      const aoaFile = await deleteAndUpload(
        payload.aoaFile,
        existingKyc.aoaFile
      );
      const directorShareholding = await deleteAndUpload(
        payload.directorShareholding,
        existingKyc.directorShareholding
      );

      // 5️⃣ Update KYC record with provided fields or keep existing
      const updatedPayload: any = {
        businessName: payload.businessName || existingKyc.businessName,
        businessType: payload.businessType || existingKyc.businessType,
        panFile,
        gstFile,
        brDoc,
        partnershipDeed,
        moaFile,
        aoaFile,
        directorShareholding,
        udhyamAadhar: payload.udhyamAadhar || existingKyc.udhyamAadhar,
        cin: payload.cin || existingKyc.cin,
        addressId: payload.addressId || existingKyc.addressId,
        partnerKycNumbers:
          payload.partnerKycNumbers || existingKyc.partnerKycNumbers,
        directorKycNumbers:
          payload.directorKycNumbers || existingKyc.directorKycNumbers,
      };

      const updatedKyc = await Prisma.businessKyc.update({
        where: { id: payload.id },
        data: updatedPayload,
      });

      if (!updatedKyc) throw ApiError.internal("Failed to update business KYC");

      // 6️⃣ Fetch related userKyc
      const userKyc = await Prisma.userKyc.findFirst({
        where: { userId: payload.userId },
        select: { id: true },
      });
      const userKycId = userKyc?.id ?? null;

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 5);

      // 7️⃣ Upsert PII consents if PAN/GST are provided
      const piiUpdates: Promise<any>[] = [];

      if (payload.panNumber) {
        piiUpdates.push(
          Prisma.piiConsent.upsert({
            where: {
              userId_piiType_scope: {
                userId: payload.userId,
                piiType: "PAN_BUSINESS",
                scope: "KYC_VERIFICATION",
              },
            },
            update: {
              userKycId,
              businessKycId: updatedKyc.id,
              piiHash: Helper.hashData(payload.panNumber.toUpperCase()),
              providedAt: new Date(),
              expiresAt,
            },
            create: {
              userId: payload.userId,
              userKycId,
              businessKycId: updatedKyc.id,
              piiType: "PAN_BUSINESS",
              piiHash: Helper.hashData(payload.panNumber.toUpperCase()),
              providedAt: new Date(),
              expiresAt,
              scope: "KYC_VERIFICATION",
            },
          })
        );
      }

      if (payload.gstNumber) {
        piiUpdates.push(
          Prisma.piiConsent.upsert({
            where: {
              userId_piiType_scope: {
                userId: payload.userId,
                piiType: "GST",
                scope: "KYC_VERIFICATION",
              },
            },
            update: {
              userKycId,
              businessKycId: updatedKyc.id,
              piiHash: Helper.hashData(payload.gstNumber.toUpperCase()),
              providedAt: new Date(),
              expiresAt,
            },
            create: {
              userId: payload.userId,
              userKycId,
              businessKycId: updatedKyc.id,
              piiType: "GST",
              piiHash: Helper.hashData(payload.gstNumber.toUpperCase()),
              providedAt: new Date(),
              expiresAt,
              scope: "KYC_VERIFICATION",
            },
          })
        );
      }

      await Promise.all(piiUpdates);

      return {
        ...updatedKyc,
        businessType: updatedKyc.businessType as BusinessType,
      };
    } catch (error) {
      console.error("updateBusinessKyc failed:", error);
      throw error;
    } finally {
      // 8️⃣ Delete all local temp files
      for (const filePath of uploadedFiles) {
        if (filePath) await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async verifyBusinessKyc(
    payload: KycVerificationInput
  ): Promise<BusinessKyc> {
    const existingKyc = await Prisma.businessKyc.findFirst({
      where: { id: payload.id },
    });

    if (!existingKyc) {
      throw ApiError.badRequest("KYC not found");
    }

    const enumStatus =
      PrismaKycStatus[payload.status as keyof typeof PrismaKycStatus];
    if (!enumStatus) {
      throw ApiError.badRequest("Invalid status value");
    }

    const updatedKyc = await Prisma.businessKyc.update({
      where: { id: existingKyc.id },
      data: {
        status: { set: enumStatus },
      },
    });

    if (!updatedKyc) {
      throw ApiError.internal("Failed to verify business kyc");
    }

    return {
      ...updatedKyc,
      businessType: updatedKyc.businessType as any,
    };
  }
}

export default KycServices;
