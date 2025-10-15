// src/orchestrators/bbps/commands/ComplaintTrackingCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class ComplaintTrackingCommand extends BaseCommand {
  name = 'COMPLAINT_TRACKING';

  protected async validate(data: any): Promise<void> {
    if (!data.complaintId) {
      throw ApiError.badRequest("Complaint ID is required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { complaintId } = data;
    
    const tracking = await BBPService.trackComplaint(complaintId);

    return {
      success: true,
      data: tracking,
      message: "Complaint status fetched successfully",
    };
  }
}