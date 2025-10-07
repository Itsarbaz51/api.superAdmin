import Prisma from "../db/db.js";
import type {
  CreateServiceInput,
  deactivateInput,
  UpdateServiceInput,
} from "../types/serivce.type.js";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/WinstonLogger.js";

export default class ServiceService {
  // ✅ Create a new service
  static async create(data: CreateServiceInput) {
    const [existingCode, existingName] = await Promise.all([
      Prisma.service.findUnique({ where: { code: data.code } }),
      Prisma.service.findUnique({ where: { name: data.name } }),
    ]);

    if (existingCode) throw ApiError.badRequest("Service code already exists");
    if (existingName) throw ApiError.badRequest("Service name already exists");

    const service = await Prisma.service.create({ data });

    logger.info("Service created", { id: service.id });

    return service;
  }

  // ✅ Get all services
  static async getAll() {
    const services = await Prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });
    return services;
  }

  // ✅ Get service by ID
  static async getById(id: string) {
    const service = await Prisma.service.findUnique({ where: { id } });
    if (!service) throw ApiError.notFound("Service not found");
    return service;
  }

  // ✅ Update service
  static async update(id: string, data: UpdateServiceInput) {
    const existing = await Prisma.service.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service not found");

    const updated = await Prisma.service.update({
      where: { id },
      data,
    });

    logger.info("Service updated", { id });
    return updated;
  }

  // ✅ Soft delete or deactivate service
  static async deactivate(id: string, statusInput: deactivateInput) {
    const existing = await Prisma.service.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Service not found");

    if (!statusInput.status) {
      throw ApiError.badRequest("Status is required to deactivate service");
    }

    const updated = await Prisma.service.update({
      where: { id },
      data: { status: statusInput.status }, // <-- fix here
    });

    logger.info("Service deactivated", { id });
    return updated;
  }
}
