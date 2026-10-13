import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { logError } from '../../utils/logger';

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const details = `${error.name}: ${error.message}\nStack: ${error.stack}\nComponent Stack: ${errorInfo.componentStack}`;
    logError('React Component Tree Crash', details);
  }

  handleRestart = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            An unexpected error occurred. A crash report has been saved to your diagnostic logs.
          </Text>
          {this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={4}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleRestart} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Try Again</Text>
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
    backgroundColor: '#0E0D14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9E9DA6',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#1E1B24',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#342F3E',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
