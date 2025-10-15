// src/services/bbps.service.ts
import axios from "axios";
import logger from "../utils/WinstonLogger.js";
import { ApiError } from "../utils/ApiError.js";
import Prisma from "../db/db.js";
import { Prisma as prisma } from "@prisma/client";

// Fixed: Add proper type definitions
interface BillValidationResult {
  isValid: boolean;
  error?: string;
  billDetails?: Record<string, any>;
  dueAmount?: number;
  dueDate?: string;
}

// Fixed: Make sure all interfaces are properly defined
interface BBPSConfig {
  baseUrl: string;
  agentId: string;
  authToken: string;
  encryptionKey: string;
  timeout: number;
}

interface Biller {
  id: string;
  name: string;
  category: string;
  validationRules: any[];
  paymentModes: string[];
  supportEmail: string;
  supportPhone: string;
}

interface PaymentProcessingResult {
  success: boolean;
  externalRefId?: string;
  providerCharge: bigint;
  response: any;
  errorCode?: string;
  errorMessage?: string;
}

export class BBPService {
  private static config: BBPSConfig = {
    baseUrl: process.env.BBPS_BASE_URL || "https://bbps-api.example.com",
    agentId: process.env.BBPS_AGENT_ID || "",
    authToken: process.env.BBPS_AUTH_TOKEN || "",
    encryptionKey: process.env.BBPS_ENCRYPTION_KEY || "",
    timeout: parseInt(process.env.BBPS_TIMEOUT || "30000"),
  };

  private static httpClient = axios.create({
    baseURL: this.config.baseUrl,
    timeout: this.config.timeout,
    headers: {
      "Content-Type": "application/json",
    },
  });

  static async createBBPSTransaction(data: {
    transactionId: string;
    billerId: string;
    consumerNumber: string;
    consumerName?: string;
    billAmount: number;
    dueAmount: number;
    dueDate?: Date;
    billDate?: Date;
    billNumber?: string;
    billPeriod?: string;
    additionalParams?: Record<string, any>;
  }) {
    try {
      // FIXED: Convert undefined values to null for Prisma
      const prismaData: prisma.BBPSTransactionCreateInput = {
        transaction: { connect: { id: data.transactionId } },
        biller: { connect: { id: data.billerId } },
        consumerNumber: data.consumerNumber,
        consumerName: data.consumerName || null, // Convert undefined to null
        billAmount: data.billAmount,
        dueAmount: data.dueAmount,
        dueDate: data.dueDate || null, // Convert undefined to null
        billDate: data.billDate || new Date(),
        billNumber: data.billNumber || null, // Convert undefined to null
        billPeriod: data.billPeriod || null, // Convert undefined to null
        billStatus: "PENDING",
        additionalParams: data.additionalParams || null,
      };

      return await Prisma.bBPSTransaction.create({
        data: prismaData,
      });
    } catch (error: any) {
      logger.error("Failed to create BBPS transaction", {
        error: error.message,
        transactionId: data.transactionId,
      });
      throw ApiError.internal("Failed to create BBPS transaction record");
    }
  }

  static async updateBBPSTransactionAfterPayment(
    bbpsTransactionId: string,
    paymentResult: PaymentProcessingResult
  ) {
    try {
      const updateData: Prisma.BBPSTransactionUpdateInput = {
        paymentResponse: paymentResult.response,
      };

      // Only add bbpsTxnId if it exists
      if (paymentResult.externalRefId) {
        updateData.bbpsTxnId = paymentResult.externalRefId;
      }

      return await Prisma.bBPSTransaction.update({
        where: { id: bbpsTransactionId },
        data: updateData,
      });
    } catch (error: any) {
      logger.error("Failed to update BBPS transaction after payment", {
        error: error.message,
        bbpsTransactionId,
      });
      throw ApiError.internal("Failed to update BBPS transaction record");
    }
  }

  static async getBBPSTransactionByTxnId(transactionId: string) {
    return await Prisma.bBPSTransaction.findUnique({
      where: { transactionId },
      include: {
        biller: true,
        transaction: true,
      },
    });
  }

  static async registerBBPSComplaint(data: {
    bbpsTransactionId: string;
    category: string;
    subCategory?: string;
    details: string;
  }) {
    try {
      // First call BBPS complaint API
      const complaintResult = await this.callBBPSComplaintAPI(data);

      // Then create complaint record in database
      const complaintData: Prisma.BBPSComplaintCreateInput = {
        bbpsTransaction: { connect: { id: data.bbpsTransactionId } },
        complaintId: complaintResult.complaintId,
        category: data.category,
        subCategory: data.subCategory || null, // Convert undefined to null
        details: data.details,
        status: "PENDING",
      };

      return await Prisma.bBPSComplaint.create({
        data: complaintData,
      });
    } catch (error: any) {
      logger.error("Failed to register BBPS complaint", {
        error: error.message,
        bbpsTransactionId: data.bbpsTransactionId,
      });
      throw ApiError.internal("Failed to register BBPS complaint");
    }
  }

  // This is the actual BBPS API call for complaint registration
  private static async callBBPSComplaintAPI(data: {
    bbpsTransactionId: string;
    category: string;
    subCategory?: string;
    details: string;
  }): Promise<{ complaintId: string }> {
    try {
      // Get BBPS transaction to get bbpsTxnId
      const bbpsTransaction = await Prisma.bBPSTransaction.findUnique({
        where: { id: data.bbpsTransactionId },
      });

      if (!bbpsTransaction) {
        throw new Error("BBPS transaction not found");
      }

      const requestData = {
        agentId: this.config.agentId,
        bbpsTxnId: bbpsTransaction.bbpsTxnId,
        category: data.category,
        details: data.details,
      };

      // Add subCategory only if it exists
      if (data.subCategory) {
        (requestData as any).subCategory = data.subCategory;
      }

      const response = await this.httpClient.post(
        "/complaint/register",
        requestData,
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      if (response.data.status === "SUCCESS") {
        return { complaintId: response.data.complaintId };
      } else {
        throw new Error(
          response.data.message || "Complaint registration failed"
        );
      }
    } catch (error: any) {
      logger.error("BBPS complaint API call failed", {
        error: error.message,
        bbpsTransactionId: data.bbpsTransactionId,
      });
      throw error;
    }
  }

  // This method is for direct complaint registration (if needed)
  static async registerComplaint(complaintData: {
    bbpsTxnId: string;
    category: string;
    subCategory?: string;
    details: string;
    consumerMobile: string;
  }): Promise<any> {
    try {
      const requestData = {
        agentId: this.config.agentId,
        bbpsTxnId: complaintData.bbpsTxnId,
        category: complaintData.category,
        details: complaintData.details,
        consumerMobile: complaintData.consumerMobile,
      };

      // Add subCategory only if it exists
      if (complaintData.subCategory) {
        (requestData as any).subCategory = complaintData.subCategory;
      }

      const response = await this.httpClient.post(
        "/complaint/register",
        requestData,
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error("BBPS complaint registration failed", {
        error: error.message,
        bbpsTxnId: complaintData.bbpsTxnId,
      });
      throw ApiError.internal("Failed to register complaint with BBPS");
    }
  }

  static async getBillers(params: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Biller[]> {
    try {
      const requestData: any = {
        agentId: this.config.agentId,
      };

      // Add optional parameters only if they exist
      if (params.category) requestData.category = params.category;
      if (params.search) requestData.search = params.search;
      if (params.page) requestData.page = params.page;
      if (params.limit) requestData.limit = params.limit;

      const response = await this.httpClient.post(
        "/biller/list",
        requestData,
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      if (response.data.status === "SUCCESS") {
        return response.data.billers || [];
      } else {
        throw new Error(response.data.message || "Failed to fetch billers");
      }
    } catch (error: any) {
      logger.error("BBPS biller list failed", {
        error: error.message,
        params,
      });
      throw ApiError.internal("Failed to fetch billers from BBPS provider");
    }
  }

  static async fetchBill(
    billerId: string,
    customerParams: Record<string, string>
  ): Promise<BillValidationResult> {
    try {
      const response = await this.httpClient.post(
        "/bill/fetch",
        {
          agentId: this.config.agentId,
          billerId,
          inputParams: customerParams,
        },
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      if (response.data.status === "SUCCESS") {
        const billDetails = response.data.billDetails;
        return {
          isValid: true,
          billDetails,
          dueAmount: billDetails.amount,
          dueDate: billDetails.dueDate,
        };
      } else {
        return {
          isValid: false,
          error: response.data.message || "Bill fetch failed",
        };
      }
    } catch (error: any) {
      logger.error("BBPS bill fetch failed", {
        error: error.message,
        billerId,
        customerParams: this.sanitizeParams(customerParams),
      });

      return {
        isValid: false,
        error:
          error.response?.data?.message || "Bill fetch service unavailable",
      };
    }
  }

  static async validateBill(data: {
    billerId: string;
    customerParams: Record<string, string>;
    amount?: bigint;
  }): Promise<BillValidationResult> {
    try {
      const requestData: any = {
        agentId: this.config.agentId,
        billerId: data.billerId,
        inputParams: data.customerParams,
      };

      // Add amount only if it exists
      if (data.amount) {
        requestData.amount = Number(data.amount) / 100;
      }

      const response = await this.httpClient.post(
        "/bill/validate",
        requestData,
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      if (response.data.status === "SUCCESS") {
        const billDetails = response.data.billDetails;

        // Validate amount if provided
        if (data.amount) {
          const dueAmount = BigInt(Math.round(billDetails.amount * 100));
          if (dueAmount !== data.amount) {
            return {
              isValid: false,
              error: `Amount mismatch. Due: ${billDetails.amount}, Provided: ${Number(data.amount) / 100}`,
            };
          }
        }

        return {
          isValid: true,
          billDetails,
          dueAmount: billDetails.amount,
          dueDate: billDetails.dueDate,
        };
      } else {
        return {
          isValid: false,
          error: response.data.message || "Bill validation failed",
        };
      }
    } catch (error: any) {
      logger.error("BBPS bill validation failed", {
        error: error.message,
        billerId: data.billerId,
      });

      return {
        isValid: false,
        error:
          error.response?.data?.message ||
          "Bill validation service unavailable",
      };
    }
  }

  static async processPayment(data: {
    transactionId: string;
    billerId: string;
    amount: bigint;
    customerParams: Record<string, string>;
    mobileNumber: string;
    email: string;
  }): Promise<PaymentProcessingResult> {
    try {
      const response = await this.httpClient.post(
        "/payment/process",
        {
          agentId: this.config.agentId,
          billerId: data.billerId,
          inputParams: data.customerParams,
          amount: Number(data.amount) / 100,
          consumerMobile: data.mobileNumber,
          consumerEmail: data.email,
          txnRefId: data.transactionId,
          timestamp: new Date().toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      if (response.data.status === "SUCCESS") {
        const providerCharge = BigInt(
          Math.round((response.data.charges || 0) * 100)
        );

        return {
          success: true,
          externalRefId: response.data.bbpsTxnId,
          providerCharge,
          response: response.data,
        };
      } else {
        return {
          success: false,
          providerCharge: BigInt(0),
          response: response.data,
          errorCode: response.data.errorCode,
          errorMessage: response.data.message,
        };
      }
    } catch (error: any) {
      logger.error("BBPS payment processing failed", {
        error: error.message,
        transactionId: data.transactionId,
        billerId: data.billerId,
      });

      return {
        success: false,
        providerCharge: BigInt(0),
        response: error.response?.data || { error: error.message },
        errorCode: "PROVIDER_ERROR",
        errorMessage: "Payment service temporarily unavailable",
      };
    }
  }

  static async getTransactionStatus(
    bbpsTxnId?: string,
    mobileNumber?: string
  ): Promise<any> {
    try {
      const params: any = {
        agentId: this.config.agentId,
      };

      // Add optional parameters only if they exist
      if (bbpsTxnId) params.bbpsTxnId = bbpsTxnId;
      if (mobileNumber) params.mobileNumber = mobileNumber;

      const response = await this.httpClient.get("/transaction/status", {
        params,
        headers: { Authorization: `Bearer ${this.config.authToken}` },
      });

      return response.data;
    } catch (error: any) {
      logger.error("BBPS status check failed", {
        error: error.message,
        bbpsTxnId,
        mobileNumber,
      });
      throw ApiError.internal("Failed to fetch transaction status from BBPS");
    }
  }

  static async trackComplaint(complaintId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `/complaint/track/${complaintId}`,
        {
          headers: { Authorization: `Bearer ${this.config.authToken}` },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error("BBPS complaint tracking failed", {
        error: error.message,
        complaintId,
      });
      throw ApiError.internal("Failed to track complaint with BBPS");
    }
  }

  static async pullPlans(billerId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/plans/${billerId}`, {
        headers: { Authorization: `Bearer ${this.config.authToken}` },
      });

      return response.data;
    } catch (error: any) {
      logger.error("BBPS plan pull failed", {
        error: error.message,
        billerId,
      });
      throw ApiError.internal("Failed to fetch plans from BBPS");
    }
  }

  private static sanitizeParams(
    params: Record<string, string>
  ): Record<string, string> {
    const sanitized = { ...params };
    const sensitive = ["password", "pin", "aadhaar", "pan"];

    for (const key of Object.keys(sanitized)) {
      if (sensitive.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = "***REDACTED***";
      }
    }

    return sanitized;
  }
}

export default BBPService;