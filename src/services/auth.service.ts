import crypto from "crypto";
import Prisma from "../db/db.js";
import type {
  JwtPayload,
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
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
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
      role: user.role.name,
    });

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
      },
    });

    return { user, accessToken, refreshToken };
  }

  static async logout(userId: string): Promise<void> {
    if (!userId) return;

    await Prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  }> {
    let payload: JwtPayload;

    try {
      payload = Helper.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const user = await Prisma.user.findUnique({
      where: { id: payload.id },
      include: { role: true },
    });

    if (!user || !user.refreshToken) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    if (user.refreshToken !== refreshToken) {
      await Prisma.user.update({
        where: { id: payload.id },
        data: { refreshToken: null },
      });
      throw ApiError.unauthorized("Refresh token mismatch");
    }

    const newAccessToken = Helper.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    const newRefreshToken = Helper.generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    await Prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
      },
    };
  }

  static async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await Prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpires: expires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const subject = "Password Reset Instructions";
    const text = `You requested a password reset.\n\nClick the link to reset your password:\n${resetUrl}\n\nThis link expires in 5 minutes.`;
    const html = `
    <p>You requested a password reset.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link will expire in 5 minutes.</p>
  `;

    await Helper.sendEmail({ to: user.email, subject, text, html });

    return { message: "Password reset link sent to your email." };
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) throw ApiError.badRequest("Invalid or expired token");

    // 2. Hash new password and update
    const hashedPassword = await Helper.hashPassword(newPassword);

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        // Invalidate refresh token on password reset
        refreshToken: null,
      },
    });

    await Helper.sendEmail({
      to: user.email,
      subject: "Your password has been changed",
      text: `Hello ${user.firstName || ""},\n\nYour password was successfully changed. If this wasn't you, please contact support immediately.`,
      html: `<p>Hello ${user.firstName || ""},</p><p>Your password was successfully changed. If this wasn't you, please <a href="mailto:support@example.com">contact support</a> immediately.</p>`,
    });

    return { message: "Password reset successful" };
  }

  static async getUserById(userId: string): Promise<User | null> {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { select: { id: true, name: true, level: true } },
        wallets: true,
        parent: { select: { id: true, username: true } },
        children: { select: { id: true, username: true } },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    const safeUser = Helper.serializeUser(user);

    return safeUser;
  }

  static async verifyEmail(token: string): Promise<{ message: string }> {
    if (!token) throw ApiError.badRequest("Verification token missing");

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await Prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
      },
    });

    if (!user) throw ApiError.badRequest("Invalid verification token");

    await Prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: null,
        emailVerifiedAt: new Date(),
        isAuthorized: true,
      },
    });

    return { message: "Email verified successfully" };
  }

  static async createAndSendEmailVerification(user: User) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await Prisma.user.update({
      where: {
        id: user.id,
      },
      data: { emailVerificationToken: tokenHash },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

    await Helper.sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Click to verify your email: ${verifyUrl}\nLink valid for 24 hours.`,
      html: `
    <p>Click the link below to verify your email address:</p>
    <p><a href="${verifyUrl}" target="_blank">Verify Email</a></p>
    <p>This link is valid for 24 hours.</p>
  `,
    });
  }
}

export default AuthServices;
