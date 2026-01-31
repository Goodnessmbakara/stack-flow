import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    // Clear all localStorage to reset app state
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-4">
          {/* Background effects */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
          
          {/* Error Modal */}
          <div className="relative max-w-2xl w-full">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
            
            {/* Main container */}
            <div className="relative backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 p-8 shadow-2xl">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 flex items-center justify-center animate-bounce-slow">
                  <svg 
                    className="w-10 h-10 text-red-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white text-center mb-3 bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Oops! Something Went Wrong
              </h1>

              {/* Description */}
              <p className="text-gray-300 text-center mb-6 leading-relaxed">
                We encountered an unexpected error. This is usually due to incompatible wallet data or connection issues.
              </p>

              {/* Error details (collapsible) */}
              <details className="mb-6 p-4 rounded-lg bg-black/20 border border-white/5">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                  View technical details
                </summary>
                <div className="mt-3 p-3 bg-black/40 rounded border border-red-500/20">
                  <code className="text-xs text-red-300 font-mono break-all">
                    {this.state.error?.message || "Unknown error"}
                  </code>
                </div>
              </details>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white
                           bg-gradient-to-r from-[#37F741]/20 to-emerald-500/20
                           hover:from-[#37F741]/30 hover:to-emerald-500/30
                           border border-[#37F741]/30 hover:border-[#37F741]/50
                           transition-all duration-300 transform hover:scale-105
                           shadow-lg shadow-[#37F741]/10"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </span>
                </button>

                <button
                  onClick={this.handleReset}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold text-white
                           bg-gradient-to-r from-purple-500/20 to-pink-500/20
                           hover:from-purple-500/30 hover:to-pink-500/30
                           border border-purple-500/30 hover:border-purple-500/50
                           transition-all duration-300 transform hover:scale-105
                           shadow-lg shadow-purple-500/10"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Data & Reset
                  </span>
                </button>
              </div>

              {/* Help text */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 text-center">
                  If the problem persists, try disconnecting your wallet or clearing your browser cache.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
