import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
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
    console.error('Uncaught error in The Burd:', error, errorInfo);
  }

  private handleReload = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.error('Error during onReset:', e);
      }
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <img
            src="/logo.svg"
            alt="The Burd"
            className="w-20 h-20 mb-4 animate-pulse object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <h1 className="text-2xl font-bold mb-2">The Burd</h1>
          <p className="text-red-400 font-mono text-sm mb-4 max-w-md bg-slate-800 p-3 rounded-lg border border-red-500/30 break-words">
            {this.state.error?.message || 'A runtime error occurred.'}
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg cursor-pointer active:scale-95"
          >
            Reload The Burd
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

