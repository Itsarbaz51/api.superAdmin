import Prisma from "../db/db.js";
import type {
  SystemSettingInput,
  SystemSetting,
} from "../types/systemSetting.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";

class SystemSettingService {
  private static mapToSystemSetting(setting: any): SystemSetting {
    return {
      userId: setting.userId ?? "",
      companyName: setting.companyName ?? "",
      companyLogo: setting.companyLogo ?? "",
      favIcon: setting.favIcon ?? "",
      phoneNumber: setting.phoneNumber ?? "",
      whtsappNumber: setting.whtsappNumber ?? "",
      companyEmail: setting.companyEmail ?? "",
      facebookUrl: setting.facebookUrl ?? "",
      instagramUrl: setting.instagramUrl ?? "",
      twitterUrl: setting.twitterUrl ?? "",
      linkedinUrl: setting.linkedinUrl ?? "",
      websiteUrl: setting.websiteUrl ?? "",
    };
  }

  static async create(
    data: SystemSettingInput,
    userId: string
  ): Promise<SystemSetting> {
    const userExists = await Prisma.systemSetting.findFirst({
      where: { userId },
    });
    if (userExists)
      throw ApiError.conflict("System setting already exists for this user");

    let companyLogoUrl = "";
    let favIconUrl = "";

    if (data.companyLogo) {
      companyLogoUrl =
        (await S3Service.upload(data.companyLogo, "system-setting")) ?? "";
    }

    if (data.favIcon) {
      favIconUrl =
        (await S3Service.upload(data.favIcon, "system-setting")) ?? "";
    }

    const payload = {
      userId,
      companyName: data.companyName,
      companyLogo: companyLogoUrl,
      favIcon: favIconUrl,
      phoneNumber: data.phoneNumber,
      whtsappNumber: data.whtsappNumber,
      companyEmail: data.companyEmail,
      facebookUrl: data.facebookUrl || "",
      instagramUrl: data.instagramUrl || "",
      twitterUrl: data.twitterUrl || "",
      linkedinUrl: data.linkedinUrl || "",
      websiteUrl: data.websiteUrl || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await Prisma.systemSetting.create({ data: payload });
    return this.mapToSystemSetting(created);
  }

  static async update(
    id: string,
    data: Partial<SystemSettingInput>
  ): Promise<SystemSetting> {
    const existing = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System setting not found");

    let companyLogoUrl = existing.companyLogo;
    let favIconUrl = existing.favIcon;

    // Upload new files if provided, delete old ones
    if (data.companyLogo) {
      if (existing.companyLogo)
        await S3Service.delete({ fileUrl: existing.companyLogo });
      companyLogoUrl =
        (await S3Service.upload(data.companyLogo, "system-setting")) ??
        companyLogoUrl;
    }

    if (data.favIcon) {
      if (existing.favIcon)
        await S3Service.delete({ fileUrl: existing.favIcon });
      favIconUrl =
        (await S3Service.upload(data.favIcon, "system-setting")) ?? favIconUrl;
    }

    const payload = {
      ...data,
      companyLogo: companyLogoUrl,
      favIcon: favIconUrl,
      updatedAt: new Date(),
    };

    const updated = await Prisma.systemSetting.update({
      where: { id },
      data: payload,
    });
    return this.mapToSystemSetting(updated);
  }

  static async getById(id: string): Promise<SystemSetting> {
    const setting = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!setting) throw ApiError.notFound("System setting not found");
    return this.mapToSystemSetting(setting);
  }

  static async getAll(page = 1, limit = 10, sort: "asc" | "desc" = "desc") {
    const skip = (page - 1) * limit;
    const dataRaw = await Prisma.systemSetting.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: sort },
    });

    const data = dataRaw.map(this.mapToSystemSetting);
    const total = await Prisma.systemSetting.count();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async delete(id: string): Promise<SystemSetting> {
    const existing = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System setting not found");

    // Delete files from S3
    if (existing.companyLogo)
      await S3Service.delete({ fileUrl: existing.companyLogo });
    if (existing.favIcon) await S3Service.delete({ fileUrl: existing.favIcon });

    const deleted = await Prisma.systemSetting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapToSystemSetting(deleted);
  }
}

export default SystemSettingService;
