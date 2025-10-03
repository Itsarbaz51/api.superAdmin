export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  email: string;
  phoneNumber: string;
  domainName: string;
  isAuthorized: boolean;
  status: "ACTIVE" | "IN_ACTIVE" | "DELETE";
  isKycVerified: boolean;
  roleId: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;

  // Relations
  role?: {
    id: string;
    name: string;
    level: number;
  };

  wallets?: {
    id: string;
    balance: bigint | string;
    currency: string;
    isPrimary: boolean;
  }[];

  parent?: Pick<User, "id" | "username" | "firstName" | "lastName"> | null;
  children?: Pick<User, "id" | "username" | "firstName" | "lastName">[];

  hierarchyLevel: number;
  hierarchyPath: string;
}

export interface RegisterPayload {
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  email: string;
  phoneNumber: string;
  transactionPin: string;
  domainName: string;
  password: string;
  confirmPassword?: string;
  roleId: string;
  parentId?: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}
