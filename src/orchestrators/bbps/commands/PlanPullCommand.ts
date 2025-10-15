// src/orchestrators/bbps/commands/PlanPullCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class PlanPullCommand extends BaseCommand {
  name = "PLAN_PULL";

  protected async validate(data: any): Promise<void> {
    if (!data.billerId) {
      throw ApiError.badRequest("Biller ID is required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { billerId } = data;

    const plans = await BBPService.pullPlans(billerId);

    return {
      success: true,
      data: plans,
      message: "Plans fetched successfully",
    };
  }
}
