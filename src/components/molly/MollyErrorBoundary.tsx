import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

// Failsafe: never let Molly crash the page. Renders a friendly fallback.
export class MollyErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[Molly] crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-background">
          <div className="text-4xl mb-3">🐾</div>
          <h2 className="text-base font-semibold text-foreground mb-1">Molly failed to load</h2>
          <p className="text-xs text-muted-foreground max-w-xs">
            Something tripped her up. Try refreshing the page.
          </p>
          {this.state.message && (
            <pre className="mt-3 text-[10px] text-muted-foreground/60 max-w-xs overflow-hidden">
              {this.state.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
