import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">
              {this.props.fallbackTitle ?? "Algo deu errado"}
            </h2>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {this.props.fallbackMessage ??
                "Ocorreu um erro ao carregar esta secao. Tente novamente ou entre em contato com o suporte."}
            </p>
            <Button variant="outline" onClick={this.handleRetry}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
