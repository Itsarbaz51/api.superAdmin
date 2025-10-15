// src/orchestrators/bbps/commands/TransactionStatusCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class TransactionStatusCommand extends BaseCommand {
  name = 'TRANSACTION_STATUS';

  protected async validate(data: any): Promise<void> {
    if (!data.bbpsTxnId && !data.mobileNumber) {
      throw ApiError.badRequest("Either BBPS Transaction ID or Mobile Number is required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { bbpsTxnId, mobileNumber } = data;
    
    const status = await BBPService.getTransactionStatus(
      bbpsTxnId,
      mobileNumber
    );

    return {
      success: true,
      data: status,
      message: "Transaction status fetched successfully",
    };
  }
}