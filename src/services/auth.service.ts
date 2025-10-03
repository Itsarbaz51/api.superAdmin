import bcrypt from "bcryptjs";
import Prisma from "../db/db.js";
import type { RegisterPayload, User } from "../types/auth.types.js";
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

    // 1. Duplicate user check
    const existingUser = await Prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }, { username }, { domainName }],
      },
    });

    if (existingUser) {
      throw ApiError.badRequest(
        "User already exists with provided credentials"
      );
    }

    // 2. Hash password and transaction pin
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(transactionPin, 10);

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
        refreshToken: null,
        refreshTokenExpiresAt: null,
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

  //   static async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
  //     // Login logic
  //   }

  //   static async logout(userId: string): Promise<void> {
  //     // Logout logic
  //   }

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
