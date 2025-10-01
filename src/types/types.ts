import type { JwtPayload } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface TokenPayload extends JwtPayload {
  id: string;
}

export type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};
export type LoginPayload = {
  username?: string;
  email?: string;
  password: string;
};

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Add more fields if needed
}

export interface FindPost {
  fileUrl?: string;
}
