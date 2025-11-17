import React, { Component, ReactNode } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isNetworkError: boolean;
}

class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isNetworkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a network-related error
    const isNetworkError = error.message.includes('Failed to fetch') || 
                          error.message.includes('Network Error') ||
                          error.message.includes('fetch');
    
    return {
      hasError: true,
      isNetworkError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Network Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, isNetworkError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.isNetworkError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <WifiOff className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h1>
              <p className="text-gray-600">
                Unable to connect to the server. Please check your internet connection and try again.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Troubleshooting:</h2>
              <ul className="text-left text-gray-600 space-y-2 text-sm">
                <li>• Check your internet connection</li>
                <li>• Verify server is accessible</li>
                <li>• Try refreshing the page</li>
                <li>• Check if you're behind a firewall</li>
              </ul>
            </div>
            
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
