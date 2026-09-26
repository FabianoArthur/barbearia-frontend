import { BRAND } from "@/config/brand";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context";
import { LogIn } from "lucide-react";

export function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-black px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={BRAND.logo}
            alt={BRAND.name}
            className="h-10 w-auto drop-shadow-md"
          />
          <span className="text-sm font-bold tracking-widest uppercase text-foreground">
            {BRAND.prefix}{" "}
            <span className="text-primary">{BRAND.highlight}</span>
          </span>
        </Link>

        {!isAuthenticated && (
          <Link to="/login">
            <Button variant="outline" size="sm">
              <LogIn className="h-4 w-4 mr-1" />
              Entrar
            </Button>
          </Link>
        )}
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
