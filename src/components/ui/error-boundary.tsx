/**
 * ErrorBoundary — catches render errors and shows fallback UI.
 *
 * Wraps child components and displays a friendly error message
 * when an unhandled error occurs during rendering.
 *
 * @module components/ui/error-boundary
 */

import React from "react";

/** Error boundary props */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Error boundary state */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary component.
 * Catches JavaScript errors in child components.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  /**
   * Reset error state to retry rendering.
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem",
          textAlign: "center" as const,
          color: "var(--text-secondary, #a0a0b8)",
        },
      },
        React.createElement("div", {
          style: { fontSize: "3rem", marginBottom: "1rem" },
        }, "⚠️"),
        React.createElement("h2", {
          style: { color: "var(--text-primary, #e0e0f0)", marginBottom: "0.5rem" },
        }, "Đã xảy ra lỗi"),
        React.createElement("p", {
          style: { marginBottom: "1rem", maxWidth: "400px" },
        }, this.state.error?.message ?? "Unexpected error occurred"),
        React.createElement("button", {
          onClick: this.handleRetry,
          style: {
            padding: "0.5rem 1.5rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #333355)",
            background: "var(--bg-secondary, #1a1a2e)",
            color: "var(--text-primary, #e0e0f0)",
            cursor: "pointer",
          },
        }, "Thử lại")
      );
    }

    return this.props.children;
  }
}
