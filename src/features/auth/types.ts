import type { Role } from "@/types";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: Role;
  establishmentId?: string;
}
