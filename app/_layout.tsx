import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Component, ReactNode } from 'react';
import { Text, ScrollView } from 'react-native';
import { I18nProvider } from '../src/i18n';
import { ProgressProvider } from '../src/context/ProgressContext';
import { AIProvider } from '../src/context/AIContext';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red', marginTop: 60 }}>App Error</Text>
          <Text style={{ marginTop: 12, fontSize: 14, color: '#333' }}>{err?.message}</Text>
          <Text style={{ marginTop: 12, fontSize: 11, color: '#666' }}>{err?.stack}</Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ProgressProvider familyId={null}>
          <AIProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
          </AIProvider>
        </ProgressProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
