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
  dob: Date;
  addressId: string;
  panNumber: string;
  aadhaarNumber: string;
  businessKycId: string;

  photo: Express.Multer.File;
  panFile: Express.Multer.File;
  aadhaarFile: Express.Multer.File;
  addressProofFile: Express.Multer.File;
}

export interface UserKycInput {
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

  photo: string;
  panFile: string;
  aadhaarFile: string;
  addressProofFile: string;
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
  panNumber: string;
  panFile: string;
  aadhaarNumber: string;
  aadhaarFile: string;
  addressProofFile: string;
  businessKycId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}


export enum BusinessType {
  PROPRIETORSHIP = "PROPRIETORSHIP",
  PARTNERSHIP = "PARTNERSHIP",
  PRIVATE_LIMITED = "PRIVATE_LIMITED"
}

export interface BusinessKyc {
  id: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  addressId: string;
  panNumber: string;
  panFile: string;
  gstNumber: string;
  gstFile: string;

  // Optional fields (nullable in DB)
  udhyamAadhar?: string | null;
  brDoc?: string | null;
  partnershipDeed?: string | null;
  partnerKycNumbers?: number | null;
  cin?: string | null;
  moaFile?: string | null;
  aoaFile?: string | null;
  directorKycNumbers?: number | null;
  directorShareholding?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessKycInput {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  addressId: string;
  panNumber: string;
  panFile: string;
  gstNumber: string;
  gstFile: string;

  // Optional fields should be nullable
  udhyamAadhar?: string | null;
  brDoc?: string | null;
  partnershipDeed?: string | null;
  partnerKycNumbers?: number | null;
  cin?: string | null;
  moaFile?: string | null;
  aoaFile?: string | null;
  directorKycNumbers?: number | null;
  directorShareholding?: string | null;
}


export interface BusinessKycUploadInput {
  userId: string;
  businessName: string;
  businessType: BusinessType;
  addressId: string;
  panNumber: string;
  panFile: Express.Multer.File;
  gstNumber: string;
  gstFile: Express.Multer.File;

  // Optional
  udhyamAadhar?: string;
  brDoc?: Express.Multer.File;
  partnershipDeed?: Express.Multer.File;
  partnerKycNumbers?: number;
  cin?: string;
  moaFile?: Express.Multer.File;
  aoaFile?: Express.Multer.File;
  directorKycNumbers?: number;
  directorShareholding?: Express.Multer.File;
}
