import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  viewName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl max-w-lg mx-auto my-12 text-center shadow-md">
          <h2 className="text-xl font-bold text-rose-800 mb-2 font-display">Something went wrong</h2>
          <p className="text-sm text-rose-600 mb-4">
            An error occurred in the <span className="font-semibold">{this.props.viewName || "view"}</span>.
          </p>
          <pre className="text-xs bg-rose-100 p-3 rounded-lg overflow-x-auto text-rose-900 text-left mb-4 font-mono max-h-40">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--accent)] text-white rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
