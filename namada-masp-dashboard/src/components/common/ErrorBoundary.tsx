import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="rounded-lg bg-red-900/20 p-4">
            <div className="text-red-400 font-medium mb-2">
              Something went wrong
            </div>
            <div className="text-red-400/80 text-sm mb-4">
              {this.state.error?.message}
            </div>
            <button
              onClick={this.resetError}
              className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 
                                 rounded-md transition-colors border border-red-500/30"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
