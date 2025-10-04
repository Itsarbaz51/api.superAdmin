export interface RoleCreatePayload {
  name: string;
  description?: string | null;
}

export interface RoleDTO {
  id: string;
  name: string;
  level: number;
  createdBy: string;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
