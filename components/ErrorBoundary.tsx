// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Typography } from "@/components/ui/Typography";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(
    error: Error,
    errorInfo: React.ErrorInfo,
  ) {
    // Log error to console in development
    console.error(
      "ErrorBoundary caught an error:",
      error,
      errorInfo,
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color="#EF4444"
            style={styles.icon}
          />
          <Typography
            variant="h2"
            weight="bold"
            style={styles.title}
          >
            Oops! Something went wrong
          </Typography>
          <Typography
            variant="body"
            color="textMuted"
            style={styles.description}
          >
            We are sorry for the inconvenience. Please try
            again.
          </Typography>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh"
              size={20}
              color="#FFFFFF"
            />
            <Typography
              variant="body"
              weight="semibold"
              style={styles.retryText}
            >
              Try Again
            </Typography>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0a0a0a",
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: "#FFFFFF",
  },
  description: {
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6C5DD3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#FFFFFF",
  },
});

export default ErrorBoundary;
