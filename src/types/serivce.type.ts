export interface CreateServiceInput {
  name: string;
  code: string;
  description?: string;
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}

export interface UpdateServiceInput {
  name?: string;
  code?: string;
  description?: string;
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}

export interface deactivateInput {
  status?: "ACTIVE" | "IN_ACTIVE" | "UNAVAILABLE";
}
