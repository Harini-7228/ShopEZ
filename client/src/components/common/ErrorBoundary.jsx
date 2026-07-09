import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    console.error('Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Alert variant="danger" className="p-4">
            <h4 className="alert-heading">⚠️ Something Went Wrong</h4>
            <p>We encountered an unexpected error. Please try refreshing the page or going back to home.</p>
            {import.meta.env.DEV && this.state.error && (
              <details className="small mt-3 p-2 bg-light rounded">
                <summary className="cursor-pointer fw-bold mb-2">Error Details (Dev Only)</summary>
                <pre className="mb-0" style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-3">
              <Button onClick={this.handleReset} className="btn-earthy">
                Back to Home
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
