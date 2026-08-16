import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { LibraryProvider } from '../contexts/LibraryContext';
import { ReaderProvider } from '../contexts/ReaderContext';
import { SecurityProvider } from '../contexts/SecurityContext';

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reader/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="book/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="category-manager" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings/appearance" />
        <Stack.Screen name="settings/data-storage" />
        <Stack.Screen name="settings/reader-settings" />
        <Stack.Screen name="settings/statistics" />
        <Stack.Screen name="settings/security" />
        <Stack.Screen name="settings/advanced" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <ReaderProvider>
          <SecurityProvider>
            <RootLayoutNav />
          </SecurityProvider>
        </ReaderProvider>
      </LibraryProvider>
    </ThemeProvider>
  );
}
