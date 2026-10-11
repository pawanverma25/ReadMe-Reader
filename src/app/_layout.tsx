import React, { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { LibraryProvider, useLibrary } from '../contexts/LibraryContext';
import { ReaderProvider } from '../contexts/ReaderContext';
import { SecurityProvider } from '../contexts/SecurityContext';
import { saveBookFilePermanently } from '../utils/storage';

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { books, addBook } = useLibrary();
  const processedUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function handleIncomingFile(url: string | null) {
      if (!url || processedUrlsRef.current.has(url)) return;
      try {
        const lower = url.toLowerCase();
        // Check if URL represents a PDF (direct .pdf file, content://, file://)
        const isPdf =
          lower.endsWith('.pdf') ||
          url.startsWith('content://') ||
          (url.startsWith('file://') && lower.endsWith('.pdf'));

        if (!isPdf) return;

        // Check if book with this URI is already in library
        const existing = books.find((b) => b.uri === url);
        if (existing) {
          processedUrlsRef.current.add(url);
          router.push(`/reader/${existing.id}`);
          return;
        }

        processedUrlsRef.current.add(url);

        // Derive title and filename
        let fileName = 'Imported_Document.pdf';
        try {
          const decoded = decodeURIComponent(url);
          const parts = decoded.split('/');
          const last = parts[parts.length - 1];
          if (last) {
            fileName = last.endsWith('.pdf') ? last : `${last}.pdf`;
          }
        } catch (_) {}

        const title = fileName.replace(/\.pdf$/i, '').replace(/[_+]/g, ' ') || 'Opened Document';
        const permanentUri = await saveBookFilePermanently(url, fileName);

        const newBook = await addBook({
          title,
          author: 'External Document',
          uri: permanentUri,
          fileSize: 2000000,
          totalPages: 1,
          categoryIds: ['cat-all'],
        });

        router.push(`/reader/${newBook.id}`);
      } catch (err) {
        console.error('[RootLayout] Error opening incoming PDF URL:', url, err);
      }
    }

    // Check initial launch intent URL
    Linking.getInitialURL().then(handleIncomingFile);

    // Listen for incoming URLs while running
    const sub = Linking.addEventListener('url', (e) => handleIncomingFile(e.url));
    return () => sub.remove();
  }, [books]);

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
