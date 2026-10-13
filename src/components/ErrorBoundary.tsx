import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('The Burd caught an unexpected error:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0b0f19] text-white p-6 select-none">
          {/* Custom Circular Bird Emblem Logo */}
          <div className="w-24 h-24 mb-6 drop-shadow-2xl flex items-center justify-center">
            <img src="/logo.svg" alt="The Burd Logo" className="w-full h-full object-contain" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            The Burd
          </h1>

          {/* Caught Error Details (Visible for Instant Diagnosis) */}
          {this.state.error && (
            <div className="mt-4 mb-2 p-3 bg-red-950/80 border border-red-500/50 rounded-lg text-red-200 text-xs font-mono max-w-md break-words text-left">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 mt-4 px-6 py-3 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <svg
              className="w-4 h-4 animate-spin-reverse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Map reload required — Click to refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
