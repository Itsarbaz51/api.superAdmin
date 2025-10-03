import type { Address } from "./address.types.js";

// ==================== Enums ====================
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

// ==================== UserKyc DB Type ====================
export interface UserKyc {
  id: string;
  userId: string;
  photo: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: Date;
  gender: Gender;

  addressId: string;
  address: Address;

  panNumber: string;
  panFile: string;

  aadhaarNumber: string;
  aadhaarFile: string;

  addressProofFile: string;

  createdAt: Date;
  updatedAt: Date;

  businessKycId: string;
  businessKyc: BusinessKyc;

  deletedAt?: Date | null;
}

// ==================== UserKyc Input Type ====================
export type UserKycInput = Omit<
  UserKyc,
  "id" | "address" | "createdAt" | "updatedAt" | "businessKyc" | "deletedAt"
>;


export interface BusinessKyc {
  id: string;
  userId: string;
  businessName: string;
  businessType: "PROPRIETORSHIP" | "PARTNERSHIP" | "PRIVATE_LIMITED";
  addressId: string;
  panNumber: string;
  panFile: string;
  gstNumber: string;
  gstFile: string;
  createdAt: Date;
  updatedAt: Date;
}
