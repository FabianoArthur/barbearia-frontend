import { useState, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "./context";
import { LoginForm } from "./components/LoginForm";
import type { LoginFormData } from "./schemas";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-messages";
import { BRAND } from "@/config/brand";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      try {
        const loggedUser = await login(data);
        toast.success("Login realizado!");
        if (loggedUser.role === "BARBER") {
          navigate("/barber", { replace: true });
        } else {
          navigate("/manager", { replace: true });
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate],
  );

  // If already authenticated, redirect to appropriate dashboard.
  // (Kept after every hook call so the hook order never changes.)
  if (isAuthenticated && user) {
    const target = user.role === "BARBER" ? "/barber" : "/manager";
    return <Navigate to={target} replace />;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4"
      style={{ background: BRAND.backdrop }}
    >
      <Card className="w-full max-w-sm border-t-4 border-t-primary shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-20 mx-auto drop-shadow-md"
          />
          <CardTitle className="text-lg tracking-widest uppercase">
            {BRAND.prefix}{" "}
            <span className="text-primary">{BRAND.highlight}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground border-b border-border pb-3">
            ACESSO AO SISTEMA
          </p>
        </CardHeader>

        <CardContent>
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
