import type { Request, Response } from "express";
import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ServiceService from "../services/service.service.js";

export default class ServiceController {
  // Create new service
  static create = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.create(req.body);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          service,
          `${service.name} Service created successfully`,
          201
        )
      );
  });

  // Get all services
  static getAll = asyncHandler(async (_req: Request, res: Response) => {
    const services = await ServiceService.getAll();
    return res
      .status(200)
      .json(
        ApiResponse.success(services, "Services fetched successfully", 200)
      );
  });

  // Get service by ID
  static getById = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.getById(req.params.id as string);
    return res
      .status(200)
      .json(ApiResponse.success(service, "Service fetched successfully", 200));
  });

  // Update service
  static update = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.update(
      req.params.id as string,
      req.body
    );
    return res
      .status(200)
      .json(ApiResponse.success(service, "Service updated successfully", 200));
  });

  // Deactivate service
  static deactivate = asyncHandler(async (req: Request, res: Response) => {
    const service = await ServiceService.deactivate(
      req.params.id as string,
      req.body
    );
    return res
      .status(200)
      .json(
        ApiResponse.success(service, "Service deactivated successfully", 200)
      );
  });
}

class ServiceProvideController {
  static index = asyncHandler(async (req: Request, res: Response) => {});
  static show = asyncHandler(async (req: Request, res: Response) => {});
  static store = asyncHandler(async (req: Request, res: Response) => {});
  static update = asyncHandler(async (req: Request, res: Response) => {});
  static destroy = asyncHandler(async (req: Request, res: Response) => {});
}
