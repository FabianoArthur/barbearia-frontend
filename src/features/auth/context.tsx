import { createContext, useContext, useCallback, type ReactNode } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import * as authService from "./services";
import type { LoginDto, RegisterDto } from "./types";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginDto) => Promise<User>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}

const AUTH_ME_KEY = "/auth/me";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    isLoading,
    mutate,
  } = useSWR<User>(AUTH_ME_KEY, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    onError: () => {
      mutate(undefined, false);
    },
  });

  const login = useCallback(
    async (data: LoginDto): Promise<User> => {
      const response = await authService.login(data);
      await mutate(response.user, { revalidate: false });
      return response.user;
    },
    [mutate],
  );

  const register = useCallback(async (data: RegisterDto): Promise<void> => {
    await authService.register(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      mutate(undefined, false);
    }
  }, [mutate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
