import type { Address } from "./address.types.js";

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export interface UserKycUploadInput {
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  gender: Gender;
  dob: Date | string;
  addressId: string;
  panNumber: string;
  aadhaarNumber: string;
  businessKycId: string;

  photo: Express.Multer.File;
  panFile: Express.Multer.File;
  aadhaarFile: Express.Multer.File;
  addressProofFile: Express.Multer.File;
}

export interface UserKyc {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  dob: Date;
  gender: Gender;
  photo: string;
  addressId: string;
  address?: Address;
  panFile: string;
  aadhaarFile: string;
  addressProofFile: string;
  businessKycId: string;
  // piiConsents?: PiiConsent[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export enum BusinessType {
  PROPRIETORSHIP = "PROPRIETORSHIP",
  PARTNERSHIP = "PARTNERSHIP",
  PRIVATE_LIMITED = "PRIVATE_LIMITED",
}

export interface BusinessKycUploadInput {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  addressId: string;
  panNumber: string;
  gstNumber: string;

  panFile: Express.Multer.File;
  gstFile: Express.Multer.File;

  // Optional files
  brDoc?: Express.Multer.File;
  partnershipDeed?: Express.Multer.File;
  moaFile?: Express.Multer.File;
  aoaFile?: Express.Multer.File;
  directorShareholding?: Express.Multer.File;

  // Optional fields
  udhyamAadhar?: string;
  partnerKycNumbers?: number;
  cin?: string;
  directorKycNumbers?: number;
}

export interface BusinessKyc {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  addressId: string;
  address?: Address;
  // panNumber: string; // You manually append this in return
  // gstNumber: string; // You manually append this in return
  panFile: string;
  gstFile: string;

  // Optional file URLs
  brDoc?: string | null;
  partnershipDeed?: string | null;
  moaFile?: string | null;
  aoaFile?: string | null;
  directorShareholding?: string | null;

  // Optional fields
  udhyamAadhar?: string | null;
  partnerKycNumbers?: number | null;
  cin?: string | null;
  directorKycNumbers?: number | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
export interface PiiConsentInput {
  userId: string;
  userKycId?: string | null; // Optional, since it's nullable in Prisma
  businessKycId?: string | null; // Optional, since it's nullable in Prisma
  piiType: string;
  piiHash: string;
  providedAt: Date;
  expiresAt: Date;
  scope: string;
}

import { KycStatus as PrismaKycStatus } from "@prisma/client";

export interface KycVerificationInput {
  id: string;
  status: PrismaKycStatus;
}

export interface FilterParams {
  userId: string;
  status?: string;
  page: number;
  limit: number;
  sort: "asc" | "desc";
}
