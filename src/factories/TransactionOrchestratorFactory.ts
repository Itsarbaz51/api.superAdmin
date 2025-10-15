// src/factories/TransactionOrchestratorFactory.ts
import { BbpsTransactionStrategy } from "../orchestrators/bbps/BbpsTransactionStrategy.js";
import type { ITransactionStrategy } from "../types/ITransactionStrategy.js";
import { ApiError } from "../utils/ApiError.js";

export class TransactionOrchestratorFactory {
  static getStrategy(serviceCode: string): ITransactionStrategy {
    switch (serviceCode.toUpperCase()) {
      case "BBPS":
        return new BbpsTransactionStrategy();
      default:
        throw ApiError.badRequest(
          `No strategy defined for service: ${serviceCode}`
        );
    }
  }
}
