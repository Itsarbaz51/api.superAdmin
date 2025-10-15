// src/types/ITransactionStrategy.ts
export interface ITransactionStrategy {
  process(transactionData: any): Promise<any>;
}

// src/types/bbps.types.ts
export interface BBPSTransactionData {
  userId: string;
  serviceId: string;
  amount: number;
  billerId: string;
  customerParams: Record<string, string>;
  channel?: string;
  idempotencyKey?: string;
  createdBy?: string;
  operation?: BBPSOperation;
}

export type BBPSOperation = 
  | 'BILLER_INFO'
  | 'BILL_FETCH'
  | 'BILL_PAYMENT'
  | 'TRANSACTION_STATUS'
  | 'COMPLAINT_REGISTER'
  | 'COMPLAINT_TRACKING'
  | 'BILL_VALIDATION'
  | 'PLAN_PULL';