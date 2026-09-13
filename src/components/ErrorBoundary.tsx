import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--md-surface)' }}
        >
          <div
            className="rounded-3xl p-8 flex flex-col items-center text-center max-w-sm w-full md-elevation-3 space-y-4"
            style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--md-error-container)',
                color: 'var(--md-on-error-container)',
              }}
            >
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2
                className="text-base font-bold font-display"
                style={{ color: 'var(--md-on-surface)' }}
              >
                Something went wrong
              </h2>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                An unexpected error occurred. Your wardrobe data is safe.
              </p>
            </div>

            {this.state.error && (
              <div
                className="w-full p-3 rounded-xl text-[11px] text-left font-mono overflow-auto max-h-24"
                style={{
                  backgroundColor: 'var(--md-surface-container)',
                  color: 'var(--md-on-surface-variant)',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: 'var(--md-surface-container)',
                  color: 'var(--md-on-surface)',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: 'var(--md-primary)',
                  color: 'var(--md-on-primary)',
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
