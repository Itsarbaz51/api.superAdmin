// src/orchestrators/bbps/commands/ComplaintRegisterCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class ComplaintRegisterCommand extends BaseCommand {
  name = 'COMPLAINT_REGISTER';

  protected async validate(data: any): Promise<void> {
    if (!data.bbpsTxnId) {
      throw ApiError.badRequest("BBPS Transaction ID is required");
    }
    if (!data.category) {
      throw ApiError.badRequest("Complaint category is required");
    }
    if (!data.details) {
      throw ApiError.badRequest("Complaint details are required");
    }
    if (!data.consumerMobile) {
      throw ApiError.badRequest("Consumer mobile number is required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { bbpsTxnId, category, subCategory, details, consumerMobile } = data;
    
    const complaint = await BBPService  .registerComplaint({
      bbpsTxnId,
      category,
      subCategory,
      details,
      consumerMobile,
    });

    return {
      success: true,
      data: complaint,
      message: "Complaint registered successfully",
    };
  }
}