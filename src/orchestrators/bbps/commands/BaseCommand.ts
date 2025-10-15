// src/orchestrators/bbps/commands/BaseCommand.ts

import logger from "../../../utils/WinstonLogger.js";

export abstract class BaseCommand {
  abstract name: string;

  async execute(data: any): Promise<any> {
    try {
      await this.validate(data);
      return await this.perform(data);
    } catch (error) {
      logger.error(`[${this.name}] Command execution failed`, {
        error: error instanceof Error ? error.message : "Unknown error",
        data: this.sanitizeData(data),
      });
      throw error;
    }
  }

  protected abstract validate(data: any): Promise<void>;
  protected abstract perform(data: any): Promise<any>;

  protected sanitizeData(data: any): any {
    const sensitive = ["password", "token", "pin", "authorization"];
    const sanitized = { ...data };

    for (const field of sensitive) {
      if (sanitized[field]) {
        sanitized[field] = "***REDACTED***";
      }
    }

    return sanitized;
  }
}
