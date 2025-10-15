// src/orchestrators/bbps/commands/BillerInfoCommand.ts
import BBPService from "../../../services/bbps.service.js";
import { ApiError } from "../../../utils/ApiError.js";
import { BaseCommand } from "./BaseCommand.js";

export class BillerInfoCommand extends BaseCommand {
  name = 'BILLER_INFO';

  protected async validate(data: any): Promise<void> {
    if (!data.category && !data.search) {
      throw ApiError.badRequest("Either category or search term is required");
    }
  }

  protected async perform(data: any): Promise<any> {
    const { category, search, page = 1, limit = 50 } = data;
    
    const billers = await BBPService.getBillers({
      category,
      search,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return {
      success: true,
      data: billers,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: billers.length,
      },
    };
  }
}