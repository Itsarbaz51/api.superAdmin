// src/orchestrators/base/BaseStrategy.ts
import { ApiError } from "../../utils/ApiError.js";
import logger from "../../utils/WinstonLogger.js";

export abstract class BaseStrategy {
  protected strategyName: string;

  constructor(strategyName: string) {
    this.strategyName = strategyName;
  }

  protected async validateInput(data: any): Promise<void> {
    if (!data) {
      throw ApiError.badRequest("Request data is required");
    }

    if (!data.userId) {
      throw ApiError.badRequest("User ID is required");
    }

    if (!data.serviceId) {
      throw ApiError.badRequest("Service ID is required");
    }

    await this.customValidation(data);
  }

  protected abstract customValidation(data: any): Promise<void>;

  protected logStart(transactionId: string, operation: string): void {
    logger.info(`[${this.strategyName}] Starting ${operation}`, {
      transactionId,
      strategy: this.strategyName,
      operation,
      timestamp: new Date().toISOString(),
    });
  }

  protected logSuccess(
    transactionId: string,
    operation: string,
    result: any
  ): void {
    logger.info(`[${this.strategyName}] ${operation} completed successfully`, {
      transactionId,
      strategy: this.strategyName,
      operation,
      result: this.sanitizeLogData(result),
      timestamp: new Date().toISOString(),
    });
  }

  protected logError(
    transactionId: string,
    operation: string,
    error: any
  ): void {
    logger.error(`[${this.strategyName}] ${operation} failed`, {
      transactionId,
      strategy: this.strategyName,
      operation,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  protected sanitizeLogData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "pin",
      "authorization",
    ];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "***REDACTED***";
      }
    }

    return sanitized;
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) break;

        logger.warn(
          `[${this.strategyName}] Retry attempt ${attempt}/${maxRetries}`,
          {
            error: lastError.message,
            delay: delayMs,
          }
        );

        await this.delay(delayMs * attempt);
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
