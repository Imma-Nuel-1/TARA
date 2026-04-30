import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">💔</div>
            <h1>Oops! Something went wrong</h1>
            <p>We encountered an unexpected error. Please try refreshing the page.</p>
            <button
              type="button"
              className="error-refresh-btn"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
