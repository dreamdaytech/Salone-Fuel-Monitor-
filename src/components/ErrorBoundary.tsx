import React, { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

/**
 * Detects if an error is a Vite stale-chunk error caused by a new deployment
 * replacing hashed JS filenames that are still referenced by old browser tabs.
 */
function isChunkLoadError(error: Error): boolean {
  const msg = error?.message?.toLowerCase() ?? '';
  const name = error?.name?.toLowerCase() ?? '';
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('error loading chunk') ||
    msg.includes('loading chunk') ||
    name.includes('chunkerror')
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  private reloadAttempted = false;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isChunkLoadError(error) && !this.reloadAttempted) {
      // Stale chunk after deployment — silently reload once
      this.reloadAttempted = true;
      console.warn('[SFM] Stale JS chunk detected after deployment. Auto-reloading...', error.message);
      window.location.reload();
      return;
    }
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // If it's a chunk error, show a friendly update notice (reload is already triggered above)
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 max-w-lg w-full text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h1 className="text-xl font-bold text-blue-700 mb-2">Updating Salone Fuel Monitor</h1>
              <p className="text-gray-500 text-sm mb-4">
                A new version of the platform is available. The page is reloading to apply the latest update...
              </p>
              <Button
                variant="primary"
                className="mt-2 px-4 py-2 rounded transition-colors"
                onClick={() => window.location.reload()}
                showNotification={false}
              >
                Reload Now
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 max-w-lg w-full">
            <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="bg-red-50 p-4 rounded text-sm text-red-800 font-mono overflow-auto max-h-64">
              {this.state.error?.message}
            </div>
            <Button
              variant="danger"
              className="mt-4 px-4 py-2 rounded transition-colors"
              onClick={() => window.location.reload()}
              showNotification={false}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
