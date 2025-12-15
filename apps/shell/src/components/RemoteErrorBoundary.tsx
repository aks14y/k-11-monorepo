import React, { Component, ReactNode } from "react";
import { Card, Stack, Heading, Text } from "@design-system";

interface Props {
  children: ReactNode;
  moduleName: string;
  remoteUrl?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RemoteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Remote module loading error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error when module changes
    if (prevProps.moduleName !== this.props.moduleName) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <Stack gap="16px">
            <Heading level={2}>Error Loading {this.props.moduleName}</Heading>
            <Text variant="muted">
              {this.state.error?.message || 
                `Failed to load remote module: ${this.props.moduleName}`}
            </Text>
            {this.props.remoteUrl && (
              <Text variant="muted" size="sm">
                Remote URL: {this.props.remoteUrl}
              </Text>
            )}
            <Text variant="muted" size="sm">
              Make sure the remote dev server is running and accessible.
            </Text>
            <Text variant="muted" size="sm">
              Check that the remote server is running on the configured port.
            </Text>
          </Stack>
        </Card>
      );
    }

    return this.props.children;
  }
}

