import { BRAND } from "@/config/brand";
import { useAuth } from "@/features/auth/context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border bg-black px-6 py-3">
      <Link to="/" className="flex items-center gap-3">
        <img
          src={BRAND.logo}
          alt={BRAND.name}
          className="h-10 w-auto drop-shadow-md"
        />
        <span className="hidden sm:inline text-sm font-bold tracking-widest uppercase text-foreground">
          {BRAND.prefix} <span className="text-primary">{BRAND.highlight}</span>
        </span>
      </Link>

      {isAuthenticated && user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Ola, {user.name || user.email || "Usuario"}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      )}
    </header>
  );
}
