import axios from "axios";
import asyncHandler from "../utils/asyncHandler.js";
import Prisma from "../db/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const API_URL_VERIFY = process.env.API_URL_BANK_VERIFY;
const API_URL_PAYOUT = process.env.API_URL_BANK_PAYOUT;

const API_HEADERS = {
  "api-key": process.env.API_KEY_BANK_VERIFY,
  "api-secret-key": process.env.API_SECRET_KEY_BANK_VERIFY,
  "Content-Type": "application/json",
};

export const verifyBank = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  
});
