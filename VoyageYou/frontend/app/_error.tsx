import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
}

export default class GlobalErrorBoundary extends React.Component<any, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ errorInfo });
    // Error caught by global boundary - logged for development
    if (__DEV__) {
      console.error('Global Error Boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Something went wrong.</Text>
          <Text style={styles.errorText}>{String(this.state.error)}</Text>
          {this.state.errorInfo && (
            <Text style={styles.stackTrace}>{this.state.errorInfo.componentStack}</Text>
          )}
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    color: '#ff5555',
    fontSize: 16,
    marginBottom: 12,
  },
  stackTrace: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
  },
}); 