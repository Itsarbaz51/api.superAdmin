import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiKeyService } from "../services/api.service.js";
import type {
  ApiKeyCreateInput,
  ApiKeyIpWhitelistCreateInput,
  ApiKeyServiceCreateInput,
} from "../types/api.types.js";

class ApiKeyController {
  // Create API Key
  static create = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ApiKeyCreateInput;
    if (!payload.userId) throw ApiError.badRequest("userId is required");

    const apiKey = await ApiKeyService.createApiKey(payload);

    return res
      .status(201)
      .json(ApiResponse.success(apiKey, "API Key created successfully", 201));
  });

  // List API Keys
  static index = asyncHandler(async (req: Request, res: Response) => {
    const { userId, page = 1, limit = 10, sort = "desc" } = req.query as any;
    if (!userId) throw ApiError.badRequest("userId query param is required");

    const apiKeys = await ApiKeyService.getAllKeys(userId, {
      page,
      limit,
      sort,
    });

    return res
      .status(200)
      .json(ApiResponse.success(apiKeys, "API Keys fetched successfully", 200));
  });

  // Deactivate API Key
  static deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("API Key id is required");

    const apiKey = await ApiKeyService.deactivateKey(id);

    return res
      .status(200)
      .json(
        ApiResponse.success(apiKey, "API Key deactivated successfully", 200)
      );
  });

  // Delete API Key
  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest("API Key id is required");

    await ApiKeyService.deleteKey(id);

    return res
      .status(200)
      .json(ApiResponse.success(null, "API Key deleted successfully", 200));
  });

  // Add Service to API Key
  static addService = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ApiKeyServiceCreateInput;
    if (!payload.apiKeyId || !payload.serviceId)
      throw ApiError.badRequest("apiKeyId and serviceId are required");

    const service = await ApiKeyService.addService(payload);

    return res
      .status(201)
      .json(ApiResponse.success(service, "Service added to API Key", 201));
  });

  // Add IP Whitelist to API Key
  static addIpWhitelist = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as ApiKeyIpWhitelistCreateInput;
    if (!payload.apiKeyId || !payload.ip)
      throw ApiError.badRequest("apiKeyId and ip are required");

    const ip = await ApiKeyService.addIpWhitelist(payload);

    return res
      .status(201)
      .json(ApiResponse.success(ip, "IP added to whitelist", 201));
  });
}

export default ApiKeyController;
