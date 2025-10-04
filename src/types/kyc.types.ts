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
  businessKycId?: string;

  photo: Express.Multer.File;

  panFile: Express.Multer.File;
  aadhaarFile: Express.Multer.File;
  addressProofFile: Express.Multer.File;
}

export interface UserKycInput {
  userId: string;
  photo: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  gender: Gender;
  dob: Date;
  addressId: string;
  panNumber: string;
  aadhaarNumber: string;
  businessKycId?: string;

  panFile: string; // S3 URL
  aadhaarFile: string;
  addressProofFile: string;
}
export interface UserKyc {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  gender: Gender;
  dob: Date;
  addressId: string;
  panNumber: string;
  aadhaarNumber: string;
  businessKycId?: string;

  panFile: Express.Multer.File | string;
  photo: Express.Multer.File | string;
  aadhaarFile: Express.Multer.File | string;
  addressProofFile: Express.Multer.File | string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
