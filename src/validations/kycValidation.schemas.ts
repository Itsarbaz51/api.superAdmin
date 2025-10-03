import { z } from "zod";
import { Gender } from "../types/kyc.types.js";

class KycValidationSchemas {
  static get UserKyc() {
    return z.object({
      userId: z.string().uuid("User ID must be a valid UUID."),
      photo: z.string().url("Photo must be a valid URL."),
      firstName: z
        .string()
        .min(3, "First name must be at least 3 characters long."),
      lastName: z
        .string()
        .min(3, "Last name must be at least 3 characters long."),
      fatherName: z
        .string()
        .min(3, "Father's name must be at least 3 characters long."),
      dob: z.date().refine((date) => !isNaN(date.getTime()), {
        message: "Date of birth must be a valid date (e.g., YYYY-MM-DD).",
      }),
      gender: z.nativeEnum(Gender, {
        message: "Gender must be one of: MALE, FEMALE, OTHER.",
      }),
      addressId: z.string().uuid("Address ID must be a valid UUID."),
      panNumber: z
        .string()
        .length(10, "PAN number must be exactly 10 characters.")
        .regex(
          /^[A-Z]{5}[0-9]{4}[A-Z]$/,
          "PAN number format is invalid."
        ),
      panFile: z.string().url("PAN file must be a valid URL."),
      aadhaarNumber: z
        .string()
        .length(12, "Aadhaar number must be exactly 12 digits.")
        .regex(/^[0-9]{12}$/, "Aadhaar number must contain only numeric digits."),
      aadhaarFile: z
        .string()
        .url("Aadhaar file must be a valid URL.")
        .refine((url) => url.toLowerCase().endsWith(".pdf"), {
          message: "Aadhaar file must be in PDF format.",
        }),
      addressProofFile: z
        .string()
        .url("Address proof file must be a valid URL.")
        .refine((url) => /\.(jpg|jpeg|png|webp)$/i.test(url), {
          message: "Address proof must be an image (JPG, JPEG, PNG, or WEBP).",
        }),
      businessKycId: z.string().uuid("Business KYC ID must be a valid UUID."),
    });
  }
}

export default KycValidationSchemas;
