import { z } from "zod";
import { AccountType } from "@prisma/client";

class BankValidationSchemas {
  // ✅ Bank create schema
  static get BankSchema() {
    return z.object({
      bankName: z.string().min(2, "Bank name is required"),
      ifscCode: z
        .string()
        .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
      bankIcon: z.string().url("Bank icon must be a valid URL").optional(),
    });
  }

  // ✅ Bank update schema
  static get BankUpdateSchema() {
    return this.BankSchema.partial();
  }

  // ✅ User Bank Detail create schema
  static get BankDetailSchema() {
    return z.object({
      accountHolder: z.string().min(3, "Account holder name is required"),
      accountNumber: z
        .string()
        .min(9, "Account number must be at least 9 digits")
        .max(18, "Account number can't exceed 18 digits"),
      phoneNumber: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number can't exceed 15 digits"),
      accountType: AccountType,
      bankId: z.string().uuid("Invalid bank ID"),
      isPrimary: z.boolean().optional(),
    });
  }

  // ✅ User Bank Detail update schema
  static get BankDetailUpdateSchema() {
    return this.BankDetailSchema.partial();
  }

  // ✅ List banks / details (for pagination)
  static get ListBankSchema() {
    return z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
      sort: z.enum(["asc", "desc"]).optional().default("desc"),
    });
  }
}

export default BankValidationSchemas;
