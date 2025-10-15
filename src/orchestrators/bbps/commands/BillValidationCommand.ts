// src/orchestrators/bbps/commands/BillValidationCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class BillValidationCommand extends BaseCommand {
  name = "BILL_VALIDATION";

  protected async validate(data: any): Promise<void> {
    if (!data.billerId) {
      throw ApiError.badRequest("Biller ID is required");
    }
    if (!data.customerParams) {
      throw ApiError.badRequest("Customer parameters are required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { billerId, customerParams, amount } = data;

    const validation = await BBPService.validateBill({
      billerId,
      customerParams,
      amount: amount ? BigInt(Math.round(amount * 100)) : undefined,
    });

    return {
      success: validation.isValid,
      data: validation,
      message: validation.isValid ? "Bill is valid" : "Bill validation failed",
    };
  }
}
