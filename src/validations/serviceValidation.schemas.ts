import { z } from "zod";
import { ServiceStatus } from "@prisma/client";

class ServiceValidationSchemas {
  static get create() {
    return z.object({
      name: z
        .string("Service name is required")
        .min(2, "Service name must be at least 2 characters"),
      code: z
        .string("Service code is required")
        .min(2, "Service code must be at least 2 characters")
        .max(10, "Service code must not exceed 10 characters"),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional().default("ACTIVE"),
    });
  }

  static get update() {
    return z.object({
      id: z.string().uuid("Invalid service ID format"),
      name: z
        .string()
        .min(2, "Service name must be at least 2 characters")
        .optional(),
      code: z
        .string()
        .min(2, "Service code must be at least 2 characters")
        .max(10, "Service code must not exceed 10 characters")
        .optional(),
      description: z.string().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
    });
  }

  static get deactivate() {
    return z
      .object({
        status: z
          .nativeEnum(ServiceStatus)
          .refine((val) => Object.values(ServiceStatus).includes(val), {
            message: "Status must be ACTIVE, IN_ACTIVE, or UNAVAILABLE",
          }),
      })
      .strict(); // Prevent extra fields
  }
}

export default ServiceValidationSchemas;
