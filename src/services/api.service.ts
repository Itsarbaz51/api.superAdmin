import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import type {
  ApiKeyCreateInput,
  ApiKeyServiceCreateInput,
  ApiKeyIpWhitelistCreateInput,
} from "../types/api.types.ts";
import crypto from "crypto";

class ApiKeyService {
  // Create API Key
  static async createApiKey(payload: ApiKeyCreateInput) {
    // Check if user exists
    const userExists = await Prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    });
    if (!userExists) throw ApiError.badRequest("User not found");

    // Generate unique key and secret
    const key = crypto.randomBytes(16).toString("hex");
    const secret = crypto.randomBytes(32).toString("hex");

    // Create API Key record
    const apiKey = await Prisma.apiKey.create({
      data: {
        userId: payload.userId,
        key,
        secret,
        label: payload.label ?? null,
        isActive: true,
        expiresAt: payload.expiresAt ?? null,
      },
    });

    return apiKey;
  }

  // List all API Keys
  static async getAllKeys(
    userId: string,
    opts: { page?: number; limit?: number; sort?: "asc" | "desc" }
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 10;
    const skip = (page - 1) * limit;
    const sort = opts.sort ?? "desc";

    const [keys, total] = await Promise.all([
      Prisma.apiKey.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: { services: true, ipWhitelists: true },
      }),
      Prisma.apiKey.count({ where: { userId } }),
    ]);

    return {
      data: keys,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Deactivate API Key
  static async deactivateKey(id: string) {
    const apiKey = await Prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw ApiError.notFound("API Key not found");

    return Prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Delete API Key
  static async deleteKey(id: string) {
    const apiKey = await Prisma.apiKey.findUnique({ where: { id } });
    if (!apiKey) throw ApiError.notFound("API Key not found");

    return Prisma.apiKey.delete({ where: { id } });
  }

  // Attach service to API Key
  static async addService(payload: ApiKeyServiceCreateInput) {
    const apiKey = await Prisma.apiKey.findUnique({
      where: { id: payload.apiKeyId },
    });
    if (!apiKey) throw ApiError.notFound("API Key not found");

    const serviceExists = await Prisma.service.findUnique({
      where: { id: payload.serviceId },
    });
    if (!serviceExists) throw ApiError.notFound("Service not found");

    // Ensure unique combination
    const existing = await Prisma.apiKeyService.findUnique({
      where: {
        apiKeyId_serviceId: {
          apiKeyId: payload.apiKeyId,
          serviceId: payload.serviceId,
        },
      },
    });
    if (existing)
      throw ApiError.badRequest("Service already attached to API Key");

    return Prisma.apiKeyService.create({ data: payload });
  }

  // Add IP Whitelist
  static async addIpWhitelist(payload: ApiKeyIpWhitelistCreateInput) {
    const apiKey = await Prisma.apiKey.findUnique({
      where: { id: payload.apiKeyId },
    });
    if (!apiKey) throw ApiError.notFound("API Key not found");

    // Prevent duplicates
    const existing = await Prisma.apiKeyIpWhitelist.findUnique({
      where: { apiKeyId_ip: { apiKeyId: payload.apiKeyId, ip: payload.ip } },
    });
    if (existing)
      throw ApiError.badRequest("IP already whitelisted for this API Key");

    return Prisma.apiKeyIpWhitelist.create({ data: payload });
  }
}

export { ApiKeyService };
