import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-muted-foreground/30 bg-muted/50 p-3 text-sm text-muted-foreground">
      <WifiOff className="h-5 w-5 shrink-0 animate-pulse" />
      <span>Conexao perdida. Atualizacoes automaticas indisponiveis.</span>
    </div>
  );
}
