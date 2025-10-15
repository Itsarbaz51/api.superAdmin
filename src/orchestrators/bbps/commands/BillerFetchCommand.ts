// src/orchestrators/bbps/commands/BillerFetchCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class BillerFetchCommand extends BaseCommand {
  name = 'BILLER_FETCH';

  protected async validate(data: any): Promise<void> {
    if (!data.billerId) {
      throw ApiError.badRequest("Biller ID is required");
    }
    if (!data.customerParams) {
      throw ApiError.badRequest("Customer parameters are required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { billerId, customerParams } = data;
    
    const billDetails = await BBPService.fetchBill(billerId, customerParams);

    if (!billDetails.isValid) {
      throw ApiError.badRequest(`Bill fetch failed: ${billDetails.error}`);
    }

    return {
      success: true,
      data: billDetails,
      message: "Bill details fetched successfully",
    };
  }
}