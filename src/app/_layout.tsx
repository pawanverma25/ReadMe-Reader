import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { LibraryProvider, useLibrary } from '../contexts/LibraryContext';
import { ReaderProvider } from '../contexts/ReaderContext';
import { SecurityProvider } from '../contexts/SecurityContext';
import { handleExternalFileUri } from '../utils/fileImport';
import { ThumbnailGenerator } from '../components/common/ThumbnailGenerator';
import { setupGlobalCrashLogging } from '../utils/logger';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

setupGlobalCrashLogging();

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { books, addBook } = useLibrary();
  const booksRef = useRef(books);
  booksRef.current = books;

  useEffect(() => {
    // Check initial launch intent URL once on mount
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleExternalFileUri(url, { books: booksRef.current, addBook, router });
      }
    });

    // Listen for incoming URLs while app is running
    const sub = Linking.addEventListener('url', (e) => {
      if (e.url) {
        handleExternalFileUri(e.url, { books: booksRef.current, addBook, router });
      }
    });

    return () => sub.remove();
  }, []);

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
        <Stack.Screen name="settings/about" />
        <Stack.Screen name="+not-found" options={{ headerShown: false, animation: 'fade' }} />
      </Stack>
      <ThumbnailGenerator />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LibraryProvider>
          <ReaderProvider>
            <SecurityProvider>
              <RootLayoutNav />
            </SecurityProvider>
          </ReaderProvider>
        </LibraryProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
