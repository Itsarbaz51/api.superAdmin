import axios from "axios";
import asyncHandler from "../utils/asyncHandler.js";
import Prisma from "../db/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const API_URL_VERIFY = process.env.API_URL_BANK_VERIFY;

const API_HEADERS = {
  "api-key": process.env.API_KEY,
  "api-secret-key": process.env.API_SECRET_KEY,
  "Content-Type": "application/json",
};

export const verifyBank = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);

  const { phone, ifsc, accountNumber, userId } = req.body;

  if (!userId) return ApiError.send(res, 403, "Unauthorized user");
  if (!phone) return ApiError.send(res, 403, "Phone number is required");

  const banks = await Prisma.bankDetail.findMany({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (!ifsc || !accountNumber) {
    if (banks.length > 0) {
      return ApiResponse.send(res, 200, "Banks fetched successfully", banks);
    } else {
      return ApiError.send(
        res,
        404,
        "No bank accounts found, please provide IFSC & Account number to add"
      );
    }
  }

  const existingAccount = await Prisma.bankDetail.findFirst({
    where: { phone, accountNumber, ifscCode: ifsc },
  });

  if (existingAccount) {
    return ApiError.send(
      res,
      409,
      "This bank account already exists for this phone"
    );
  }

  const txnid = Date.now().toString();

  const response = await axios.post(
    API_URL_VERIFY,
    { ifsc, account: accountNumber, name: "NA", txnid },
    { headers: API_HEADERS }
  );

  if (response.data.status !== "SUCCESS") {
    return ApiError.send(res, 400, `Verification failed: ${response.data.msg}`);
  }

  const { accountHolder, bankName } = response.data;

  const newBank = await Prisma.bankDetail.create({
    data: {
      userId,
      phone,
      accountNumber,
      ifscCode: ifsc,
      bankName,
      accountHolder,
      isVerified: true,
    },
  });

  return ApiResponse.send(
    res,
    200,
    "Bank verified & added successfully",
    newBank
  );
});
