import Prisma from "../db/db.js";
import type { BankDetailInput, BankInput } from "../types/bank.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";

export class BankService {
  // Get all banks
  static async index() {
    return Prisma.banks.findMany({ orderBy: { bankName: "asc" } });
  }

  // Get single bank
  static async show(id: string) {
    const bank = await Prisma.banks.findUnique({ where: { id } });
    if (!bank) throw ApiError.notFound("Bank not found");
    return bank;
  }

  // Add new bank
  static async store(data: BankInput) {
    const existing = await Prisma.banks.findFirst({
      where: { ifscCode: data.ifscCode },
    });
    if (existing) throw ApiError.badRequest("IFSC already exists");
    return Prisma.banks.create({ data });
  }

  // Update bank
  static async update(id: string, data: Partial<BankInput>) {
    const bank = await Prisma.banks.findUnique({ where: { id } });
    if (!bank) throw ApiError.notFound("Bank not found");
    return Prisma.banks.update({ where: { id }, data });
  }

  // Delete bank
  static async destroy(id: string) {
    const bank = await Prisma.banks.findUnique({ where: { id } });
    if (!bank) throw ApiError.notFound("Bank not found");
    return Prisma.banks.delete({ where: { id } });
  }
}

// ================= USER BANK DETAILS =================

export class BankDetailService {
  // Get user bank accounts
  static async index(userId: string) {
    return Prisma.bankDetail.findMany({
      where: { userId },
      include: { bank: true },
    });
  }

  // Get single user bank
  static async show(id: string, userId: string): Promise<any> {
    const record = await Prisma.bankDetail.findUnique({
      where: { id },
      include: { bank: true },
    });
    if (!record || record.userId !== userId)
      throw ApiError.forbidden("Unauthorized access");
    return record;
  }

  // Add new bank detail
  static async store(payload: BankDetailInput) {
    const { bankProofFile, ...rest } = payload;

    const proofUrl = bankProofFile
      ? await S3Service.upload(bankProofFile.path, "bankdoc")
      : "";

    if (!proofUrl) throw ApiError.internal("Proof upload failed");

    // If primary, make all others non-primary
    if (payload.isPrimary) {
      await Prisma.bankDetail.updateMany({
        where: { userId: payload.userId },
        data: { isPrimary: false },
      });
    }

    return Prisma.bankDetail.create({
      data: {
        ...rest,
        bankProofFile: proofUrl,
      },
    });
  }

  // Update user bank detail
  static async update(
    id: string,
    userId: string,
    payload: Partial<BankDetailInput>
  ) {
    const record = await Prisma.bankDetail.findUnique({ where: { id } });

    if (!record || record.userId !== userId) {
      throw ApiError.forbidden("Unauthorized access");
    }

    // Ensure proofUrl is always a string, even if record.bankProofFile is null
    let proofUrl;

    // If a new bankProofFile is provided, delete the old one and upload the new one
    if (payload.bankProofFile) {
      if (proofUrl) {
        await S3Service.delete({ fileUrl: proofUrl });
      }

      proofUrl = await S3Service.upload(payload.bankProofFile.path, "bankdoc");
    }

    // If the updated record should be primary, set all others to non-primary first
    if (payload.isPrimary) {
      await Prisma.bankDetail.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    // Update the bank detail record with the new data and updated proofUrl
    return Prisma.bankDetail.update({
      where: { id },
      data: {
        ...payload,
        bankProofFile: proofUrl as string,
      },
    });
  }

  // Delete user bank
  static async destroy(id: string, userId: string) {
    const record = await Prisma.bankDetail.findUnique({ where: { id } });
    if (!record || record.userId !== userId)
      throw ApiError.forbidden("Unauthorized access");
    await Prisma.bankDetail.delete({ where: { id } });
    return { message: "Bank detail deleted successfully" };
  }
}
