import { api } from "@/lib/api";
import type { AuthResponse, User } from "@/types";
import type { LoginDto, RegisterDto } from "./types";

export async function login(data: LoginDto): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function register(data: RegisterDto): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await api.get<User>("/auth/me");
  return res.data;
}

export async function refresh(): Promise<void> {
  await api.post("/auth/refresh");
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
