import type { Role } from "@/types";

export type SortByField = "name" | "role" | "createdAt";
export type SortOrder = "asc" | "desc";

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  role?: Role;
  search?: string;
  sortBy?: SortByField;
  sortOrder?: SortOrder;
  establishmentId?: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  establishmentId?: string;
  commissionPercent?: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: Role;
}
