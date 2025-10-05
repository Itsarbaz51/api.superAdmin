import { z } from "zod";

// Required file
export const requiredFileSchema = z
  .any()
  .refine((file) => !!file, "File is required")
  .refine(
    (file) => ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype),
    "Only PDF or image files are allowed"
  )
  .transform((file) => ({
    ...file,
    fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
  }));

// Optional file
export const optionalFileSchema = z
  .any()
  .optional()
  .refine(
    (file) => !file || ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype),
    "Only PDF or image files are allowed"
  )
  .transform((file) => (!file ? null : { ...file, fileType: file.mimetype === "application/pdf" ? "pdf" : "image" }));


class KycValidationSchemas {
  static get UserKyc() {
    return z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      fatherName: z.string().min(1, "Father name is required"),
      dob: z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        "Invalid date format"
      ),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]),
      addressId: z.string().uuid(),
      panNumber: z.string().length(10, "PAN number must be 10 characters"),
      aadhaarNumber: z.string().length(12, "Aadhaar number must be 12 characters"),
      businessKycId: z.string().optional(),
    });
  }

  static get BusinessKycSchema() {
    return z.object({
      businessName: z.string().min(2),
      businessType: z.enum(["PROPRIETORSHIP", "PARTNERSHIP", "PRIVATE_LIMITED"]),
      addressId: z.string().uuid(),
      panNumber: z.string().min(10),
      gstNumber: z.string().min(10),
    });
  }
}

export default KycValidationSchemas;
