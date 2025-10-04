import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import type { RoleCreatePayload, RoleDTO } from "../types/role.types.js";

class RoleServices {
  static async store(
    payload: RoleCreatePayload & { createdBy: string }
  ): Promise<RoleDTO> {
    const { name, description, createdBy } = payload;

    const existingByName = await Prisma.role.findUnique({ where: { name } });
    if (existingByName)
      throw ApiError.conflict("Role with this name already exists");

    // 2. Auto-determine level
    const maxLevelRole = await Prisma.role.findFirst({
      orderBy: { level: "desc" },
    });
    const level = maxLevelRole ? maxLevelRole.level + 1 : 0;

    const role = await Prisma.role.create({
      data: {
        name,
        level,
        description: description ?? null,
        createdByUser: { connect: { id: createdBy } },
      },
    });

    // 4. Assign default permissions
    const services = await Prisma.service.findMany();
    if (services.length > 0) {
      await Prisma.rolePermission.createMany({
        data: services.map((service) => ({
          roleId: role.id,
          serviceId: service.id,
          canView: true,
          canEdit: false,
          canSetCommission: false,
        })),
        skipDuplicates: true,
      });
    }

    // 5. Return DTO
    const dto: RoleDTO = {
      id: role.id,
      name: role.name,
      level: role.level,
      description: role.description ?? null,
      createdBy,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    return dto;
  }
}

export default RoleServices;
