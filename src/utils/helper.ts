import bcrypt from "bcryptjs";
import type ms from "ms";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.types.js";
import nodemailer from "nodemailer";

class Helper {
  static async hashPassword(password: string): Promise<string> {
    if (!password) throw new Error("Password is required for hashing.");
    return await bcrypt.hash(password, 10);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string
  ): Promise<boolean> {
    if (!password || !hashedPassword) return false;
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateAccessToken = (payload: JwtPayload) => {
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET not defined in env");
    }

    const options: SignOptions = {
      expiresIn: (process.env.ACCESS_TOKEN_EXPIRY as ms.StringValue) || "15m",
    };

    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, options);
  };

  static generateRefreshToken = (payload: JwtPayload) => {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error("REFRESH_TOKEN_SECRET not defined in env");
    }

    const options: SignOptions = {
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRY as ms.StringValue) || "7d",
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
  };

  static verifyRefreshToken = (token: string) => {
    try {
      const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!);
      return decode as JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  };

  static serializeUser(user: any) {
    return JSON.parse(
      JSON.stringify(user, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
  }

  static async sendEmail({
    to,
    subject,
    text,
    html,
  }: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || `"App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  }
}

export default Helper;
