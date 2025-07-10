import React, { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

const DEBUG = import.meta.env.VITE_DEBUG === 'true'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    if (DEBUG) {
      console.error('[DEBUG] ErrorBoundary caught an error:', error)
      console.error('[DEBUG] Error info:', errorInfo)
    }

    // Store error info in state
    this.setState({
      error,
      errorInfo
    })

    // You can also log the error to an error reporting service here
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In a real application, you would send this to your error reporting service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    if (DEBUG) {
      console.log('[DEBUG] Error report:', errorReport)
    }

    // Example: Send to error reporting service
    // errorReportingService.report(errorReport)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h1>Oops! Something went wrong</h1>
            <p>
              We're sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
            </p>
            
            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload}
                className="btn btn-secondary"
              >
                Reload Page
              </button>
            </div>

            {DEBUG && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Debug Mode)</summary>
                <div className="error-info">
                  <h3>Error Message:</h3>
                  <pre>{this.state.error.message}</pre>
                  
                  <h3>Stack Trace:</h3>
                  <pre>{this.state.error.stack}</pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <h3>Component Stack:</h3>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 