import bcrypt from "bcryptjs";
import Prisma from "../db/db.js";
import type {
  LoginPayload,
  RegisterPayload,
  User,
} from "../types/auth.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

class AuthServices {
  static async register(payload: RegisterPayload): Promise<{
    user: User;
    accessToken: string;
  }> {
    const {
      username,
      firstName,
      lastName,
      profileImage,
      email,
      phoneNumber,
      transactionPin,
      domainName,
      password,
      roleId,
      parentId,
    } = payload;

    const existingUser = await Prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNumber }, { username }, { domainName }] },
    });
    if (existingUser) throw ApiError.badRequest("User already exists");

    const role = await Prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw ApiError.badRequest("Invalid roleId");

    const hashedPassword = await Helper.hashPassword(password);
    const hashedPin = await Helper.hashPassword(transactionPin);

    // 3. Hierarchy metadata
    let hierarchyLevel = 0;
    let hierarchyPath = "";

    if (parentId) {
      const parent = await Prisma.user.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw ApiError.badRequest("Invalid parentId");
      }
      hierarchyLevel = parent.hierarchyLevel + 1;
      hierarchyPath = parent.hierarchyPath
        ? `${parent.hierarchyPath}/${parentId}`
        : `${parentId}`;
    }

    // 4. Create user
    const user = await Prisma.user.create({
      data: {
        username,
        firstName,
        lastName,
        profileImage,
        email,
        phoneNumber,
        domainName,
        roleId,
        password: hashedPassword,
        transactionPin: hashedPin,
        isAuthorized: false,
        isKycVerified: false,
        status: "ACTIVE",
        hierarchyLevel,
        hierarchyPath,
        parentId,
        refreshToken: null,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        wallets: true,
        parent: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        children: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 5. Default wallet
    await Prisma.wallet.create({
      data: {
        userId: user.id,
        balance: BigInt(0),
        currency: "INR",
        isPrimary: true,
      },
    });

    // 6. Tokens
    const accessToken = Helper.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    return { user, accessToken };
  }

  static async login(
    payload: LoginPayload
  ): Promise<{ user: User; accessToken: string }> {
    const { emailOrUsername, password } = payload;

    const user = await Prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
      include: {
        role: true,
        wallets: true,
      },
    });

    if (!user) throw ApiError.unauthorized("Invalid credentials");

    // 2. Verify password
    const isValid = await Helper.comparePassword(password, user.password);
    if (!isValid) throw ApiError.unauthorized("Invalid credentials");

    // 3. Generate tokens
    const accessToken = Helper.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    const refreshToken = Helper.generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
      },
    });

    return { user, accessToken };
  }

  static async logout(userId: string): Promise<void> {
    if (!userId) return;

    await Prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  //   static async refreshToken(token: string): Promise<{ token: string }> {
  //     // Token refresh logic
  //   }

  //   static async forgotPassword(email: string): Promise<void> {
  //     // Forgot password logic
  //   }

  //   static async resetPassword(token: string, newPassword: string): Promise<void> {
  //     // Reset password logic
  //   }

  //   static async getUserById(userId: string): Promise<User | null> {
  //     // Get user details
  //   }

  //   static async verifyEmail(token: string): Promise<void> {
  //     // Email verification
  //   }
}

export default AuthServices;
