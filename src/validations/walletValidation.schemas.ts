import { z } from "zod";

class WallletValidationSchemas {
 

  static get walletCreditSchema() {
    return z.object({
      userId: z.string().uuid(),
      amount: z.number().positive(),
      narration: z.string().optional(),
    });
  }

  static get walletDebitSchema() {
    return z.object({
      userId: z.string().uuid(),
      amount: z.number().positive(),
      narration: z.string().optional(),
    });
  }
}

export default WallletValidationSchemas;
