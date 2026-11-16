import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            maxWidth: "600px",
            margin: "60px auto",
            padding: "32px",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            background: "#fff7f7",
            color: "#991b1b",
          }}
        >
          <h2>Something went wrong</h2>

          <p>
            We encountered an unexpected problem while
            displaying this page.
          </p>

          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: "10px 18px",
              marginRight: "16px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>

          <a href="/">Return to Listings</a>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
